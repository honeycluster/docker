#!/bin/bash
set -euo pipefail

# Build Clio against a custom libxrpl (rippled) per BUILD.md "Building with a Custom libxrpl".
# Flow: install deps → clone rippled → export xrpl to Conan → clone Clio → patch conanfile → build Clio.
gcc_release=${GCC_RELEASE:-14}
conan_version=${CONAN_VERSION:-2.24}
branch=${BRANCH:-develop}
version=${VERSION:-}
git_ref=${version:-${branch}}
clio_src=${CLIO_SRC:-/opt/clio}

# Custom libxrpl: rippled repo and ref to export, Conan user/channel, optional version override
rippled_repo=${RIPPLED_REPO:-https://github.com/XRPLF/rippled.git}
rippled_ref=${RIPPLED_REF:-develop}
rippled_src=${RIPPLED_SRC:-/opt/rippled}
conan_user=${CONAN_USER:-custom}
conan_channel=${CONAN_CHANNEL:-local}
xrpl_version=${XRPL_VERSION:-}

# --- C++ environment ---
apt update
DEBIAN_FRONTEND=noninteractive apt install --yes --no-install-recommends \
  tzdata \
  gcc-${gcc_release} \
  g++-${gcc_release} \
  python3-pip \
  python-is-python3 \
  python3-venv python3-dev \
  curl \
  wget \
  ca-certificates \
  git \
  build-essential \
  cmake \
  libc6-dev

# Install Conan using pip
pip3 install --break-system-packages "conan==${conan_version}" 2>/dev/null || \
  pip3 install "conan==${conan_version}"

# Update alternatives for gcc
update-alternatives --install /usr/bin/cc cc /usr/bin/gcc-${gcc_release} 999
update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-${gcc_release} 100 \
  --slave /usr/bin/g++ g++ /usr/bin/g++-${gcc_release} \
  --slave /usr/bin/gcc-ar gcc-ar /usr/bin/gcc-ar-${gcc_release} \
  --slave /usr/bin/gcc-nm gcc-nm /usr/bin/gcc-nm-${gcc_release} \
  --slave /usr/bin/gcc-ranlib gcc-ranlib /usr/bin/gcc-ranlib-${gcc_release} \
  --slave /usr/bin/gcov gcov /usr/bin/gcov-${gcc_release} \
  --slave /usr/bin/gcov-tool gcov-tool /usr/bin/gcov-tool-${gcc_release} \
  --slave /usr/bin/gcov-dump gcov-dump /usr/bin/gcov-dump-${gcc_release} \
  --slave /usr/bin/lto-dump lto-dump /usr/bin/lto-dump-${gcc_release}
update-alternatives --auto cc
update-alternatives --auto gcc

# Add xrplf remote (for other deps; custom xrpl comes from local export)
conan remote add --index 0 xrplf https://conan.ripplex.io 2>/dev/null || true

# --- Custom libxrpl: clone rippled and export to Conan ---
git clone --single-branch --branch "${rippled_ref}" "${rippled_repo}" "${rippled_src}"
cd "${rippled_src}"

# Version for Conan: use override, or read from rippled's BuildInfo.cpp (same as conanfile set_version)
if [ -n "${xrpl_version}" ]; then
  xrpl_export_version="${xrpl_version}"
else
  buildinfo="${rippled_src}/src/libxrpl/protocol/BuildInfo.cpp"
  if [ -f "${buildinfo}" ]; then
    xrpl_export_version=$(grep -m1 'versionString' "${buildinfo}" | sed -n 's/.*versionString.*=.*"\([^"]*\)".*/\1/p')
  fi
  if [ -z "${xrpl_export_version:-}" ]; then
    xrpl_export_version=$(git describe --tags --always 2>/dev/null || echo "custom")
  fi
fi

conan export . --user="${conan_user}" --channel="${conan_channel}"
echo "Exported xrpl/${xrpl_export_version}@${conan_user}/${conan_channel}"

# --- Clone Clio and patch conanfile to use custom xrpl ---
cd /
git clone --single-branch --branch "${git_ref}" https://github.com/XRPLF/clio.git "${clio_src}"
cd "${clio_src}"

# Replace xrpl requirement with custom package (version must match exported rippled)
conanfile="${clio_src}/conanfile.py"
if [ ! -f "${conanfile}" ]; then
  echo "ERROR: conanfile.py not found at ${conanfile}" >&2
  exit 1
fi
sed -i "s|\"xrpl/[^\"]*\"|\"xrpl/${xrpl_export_version}@${conan_user}/${conan_channel}\"|" "${conanfile}"
grep -E '"xrpl/' "${conanfile}" || true

# Lockfile pins upstream xrpl; skip it so Conan uses our custom package
if [ -f conan.lock ]; then
  mv conan.lock conan.lock.bak
fi

# Do not run repo init.sh when using custom xrpl (it may reset Conan home)

# Create build directory and enter it
mkdir -p build
cd build

# Install dependencies (no lockfile)
conan install .. --output-folder . --build missing --settings build_type=Release

# Configure and build Clio
cmake \
  -DCMAKE_TOOLCHAIN_FILE:FILEPATH=build/generators/conan_toolchain.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  ..
cmake --build . --parallel "$(nproc)"

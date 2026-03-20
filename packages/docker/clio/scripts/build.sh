#!/bin/bash
set -euo pipefail

# Clio build per https://github.com/XRPLF/clio/blob/develop/docs/build-clio.md 
# (CMake + Conan, C++23, GCC 14, Conan 2.20.1+)
gcc_release=${GCC_RELEASE:-14}
gcc_major=${gcc_release%%.*}
conan_version=${CONAN_VERSION:-2.24}
branch=${BRANCH:-develop}
version=${VERSION:-}
git_ref=${version:-${branch}}
clio_src=${CLIO_SRC:-/opt/clio}

# --- C++ environment ---
apt update
DEBIAN_FRONTEND=noninteractive apt install --yes --no-install-recommends \
  tzdata \
  gcc-${gcc_major} \
  g++-${gcc_major} \
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
update-alternatives --install /usr/bin/cc cc /usr/bin/gcc-${gcc_major} 999
update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-${gcc_major} 100 \
  --slave /usr/bin/g++ g++ /usr/bin/g++-${gcc_major} \
  --slave /usr/bin/gcc-ar gcc-ar /usr/bin/gcc-ar-${gcc_major} \
  --slave /usr/bin/gcc-nm gcc-nm /usr/bin/gcc-nm-${gcc_major} \
  --slave /usr/bin/gcc-ranlib gcc-ranlib /usr/bin/gcc-ranlib-${gcc_major} \
  --slave /usr/bin/gcov gcov /usr/bin/gcov-${gcc_major} \
  --slave /usr/bin/gcov-tool gcov-tool /usr/bin/gcov-tool-${gcc_major} \
  --slave /usr/bin/gcov-dump gcov-dump /usr/bin/gcov-dump-${gcc_major} \
  --slave /usr/bin/lto-dump lto-dump /usr/bin/lto-dump-${gcc_major}
update-alternatives --auto cc
update-alternatives --auto gcc

# Add xrplf remote (Artifactory for prebuilt deps including xrpl)
conan remote add --index 0 xrplf https://conan.ripplex.io 2>/dev/null || true

# Clone Clio repository
git clone --single-branch --branch "${git_ref}" https://github.com/XRPLF/clio.git "${clio_src}"
cd "${clio_src}"

# Optional: run repo Conan init (profiles + remote) if present
if [ -f .github/scripts/conan/init.sh ]; then
  ./.github/scripts/conan/init.sh
fi

# Force default Conan profile to use installed GCC (e.g. 14) so dependency builds (abseil, etc.) use gcc-${gcc_major}, not a profile default like 15.
conan_home="${CONAN_HOME:-$HOME/.conan2}"
profiles_dir="${conan_home}/profiles"
mkdir -p "${profiles_dir}"
cat > "${profiles_dir}/default" << EOF
[settings]
arch=$(uname -m)
build_type=Release
compiler=gcc
compiler.cppstd=20
compiler.libcxx=libstdc++11
compiler.version=${gcc_major}
os=Linux

[conf]
tools.build:compiler_executables={"c": "/usr/bin/gcc-${gcc_major}", "cpp": "/usr/bin/g++-${gcc_major}"}
EOF

# Create build directory and enter it (per build-clio.md)
mkdir -p build
cd build

# Install dependencies using Conan (uses conan.lock when present).
# Override compiler to match installed GCC so the generated toolchain uses gcc-${gcc_major}, not the profile default (e.g. 15).
conan install .. --output-folder . --build missing \
  --settings build_type=Release \
  --settings compiler=gcc \
  --settings compiler.version=${gcc_major} \
  --settings compiler.libcxx=libstdc++11

# Configure CMake
export CMAKE_BUILD_PARALLEL_LEVEL=$(nproc)
cmake \
  -DCMAKE_TOOLCHAIN_FILE:FILEPATH=build/generators/conan_toolchain.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  ..

# Build Clio (produces clio_server and clio_tests)
cmake --build .

#!/bin/bash

# xrpld/rippled build per https://github.com/XRPLF/rippled/blob/develop/BUILD.md
# C++ env: GCC 12, Python, Conan 2.17+, CMake
gcc_release=${GCC_RELEASE:-12}
conan_version=${CONAN_VERSION:-2.17}
branch=${BRANCH:-release}
xrpld_src=${XRPLD_SRC:-/opt/xrpl}

# --- C++ environment ---
apt update
DEBIAN_FRONTEND=noninteractive apt install --yes --no-install-recommends \
  tzdata \
  gcc-${gcc_release} g++-${gcc_release} \
  python3-pip python-is-python3 python3-venv python3-dev \
  curl wget ca-certificates git build-essential cmake ninja-build libc6-dev

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

# Add xrplf remote
conan remote add --index 0 xrplf https://conan.ripplex.io 2>/dev/null || true

# Clone rippled repository
git clone --single-branch --branch "${branch}" https://github.com/XRPLF/rippled.git "${xrpld_src}"
cd "${xrpld_src}"

# Use the repo's default Conan profile
conan config install conan/profiles/ -tf "$(conan config home)/profiles/"

# Create build directory and change to it
mkdir -p .build
cd .build

# Install dependencies using Conan
conan install .. --output-folder . --build missing --settings build_type=Release

# Configure CMake
cmake \
  -DCMAKE_TOOLCHAIN_FILE:FILEPATH=build/generators/conan_toolchain.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -Dxrpld=ON \
  -Dtests=ON \
  ..

# Build rippled
cmake --build .

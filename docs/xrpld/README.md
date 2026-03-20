###

<img src="https://i.imgur.com/kmtfYnM.png" alt="XRP logo" width="100" />

###

# xrpld Docker images

| Doc               | Image              | Description                                          |
| ----------------- | ------------------ | ---------------------------------------------------- |
| [base](base.md)   | `base.dockerfile`  | Pre-built binary from rippled deb repo; Ubuntu-based |
| [build](build.md) | `build.dockerfile` | xrpld built from source (Conan); produces base       |

**Config mount for custom files:** use **`/opt/xrpl/etc`** for `xrpld.cfg` and `validators.txt`. Mounted files are not overwritten.

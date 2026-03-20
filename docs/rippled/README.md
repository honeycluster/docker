###

<img src="https://i.imgur.com/kmtfYnM.png" alt="XRP logo" width="100" />

###

# rippled Docker images

| Doc                               | Image                              | Description                                                      |
| --------------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| [base](base.md)                   | `base.dockerfile`                  | Pre-built binary from rippled deb repo; Ubuntu-based             |
| [build](build.md)                 | `build.dockerfile`                 | rippled built from source (Conan); produces base                 |
| [configuration](configuration.md) | —                                  | All config options and **`/opt/ripple/etc`** mount               |

**Config mount for custom files:** use **`/opt/ripple/etc`** for `rippled.cfg` and `validators.txt`. Mounted files are not overwritten.

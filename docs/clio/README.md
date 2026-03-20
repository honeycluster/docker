###

<img src="https://i.imgur.com/kmtfYnM.png" alt="XRP logo" width="100" />

###

# Clio Docker images

| Doc                               | Image                              | Description                                        |
| --------------------------------- | ---------------------------------- | -------------------------------------------------- |
| [base](base.md)                   | `base.dockerfile`                  | Pre-built binary from GitHub releases; Ubuntu-based |
| [build](build.md)                 | `build.dockerfile`                 | Clio built from source (Conan); produces base       |
| [configuration](configuration.md) | —                                  | All config properties and options                   |

**Config mount for custom files:** use **`/opt/clio/etc`** for `config.json`. Mounted files are not overwritten.

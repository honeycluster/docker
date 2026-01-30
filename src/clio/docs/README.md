###

<img src="https://i.imgur.com/kmtfYnM.png" alt="XRP logo" width="100" />

###

# Clio Docker images

| Doc                                                                                                 | Image                              | Description                                               |
| --------------------------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------- |
| [base](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/base.md)                   | `base.dockerfile` / `build` target | Static config, no injection; Ubuntu-based                 |
| [slim](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/slim.md)                   | `slim.dockerfile` / `build` target | Debian slim, static config; minimal footprint             |
| [envt](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/envt.md)                   | `envt.dockerfile` / `build` target | Envsubst templates → `/opt/clio/etc`; env-based config    |
| [build](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/build.md)                 | `build.dockerfile`                 | Clio built from source (Conan); produces base, slim, envt |
| [configuration](https://github.com/honeycluster/docker/blob/develop/src/clio/docs/configuration.md) | —                                  | All config properties and env-based options for **envt**  |

**Config mount for custom files:** use **`/opt/clio/etc`** for `config.json`. On **base** and **slim**, mounted files are not overwritten (no template injection). On **envt**, the entrypoint runs template injection into this directory on each start.

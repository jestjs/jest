# Contributions

Documentation was updated to correct dependency listings for Babel transpilation using Babel 7.

Due to Babel 7's lack of backwards compatibility with Babel 6 package names, a "bridge" package was released to point 6 packages to the 7-beta packages.

The bridge package is incorrectly semvar'd in both Babel and Jest documentation, causing the bridge package not to be found by yarn and causing earlier beta builds to match erroneously.

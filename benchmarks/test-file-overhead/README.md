First, run `./prepare.sh` to generate the benchmark files. On Windows, use a Bash (WSL, Git, Cygwin …) to do this, but you can use CMD for the actual benchmark run if the CMD environment is what you want to benchmark for.

To run the benchmark, use a benchmarking tool such as [hyperfine](https://github.com/sharkdp/hyperfine):

```sh
hyperfine -w 3 -m 10 ../../jest /tmp/other-jest-clone-to-compare-against/jest
```

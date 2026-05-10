# CIStamp examples

Run a checked-in fixture and produce both JSON and Markdown evidence:

```sh
npm run build
node dist/cli.js run --out .cistamp/example.json --markdown .cistamp/example.md --hash examples/fixtures/pass.mjs -- node examples/fixtures/pass.mjs
node dist/cli.js render .cistamp/example.json --out .cistamp/example-rendered.md
```

The pass fixture prints a fake API key so you can see redaction happen without
risking a real secret.

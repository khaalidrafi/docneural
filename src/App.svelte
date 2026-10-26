<script lang="ts">
  import DocneuralApp from 'docneural-ui'
  // BASE_URL is vite's build base: '/' locally (store strips it back to
  // ''), '/docneural/' on the GitHub Pages project site — the store then
  // fetches <base>/graph.json, /docs/SLUG.html, /ctx/<id>.json, exactly
  // the shape vite's publicDir=.export serves. Hardcoding '' broke every
  // non-root deploy; deriving it makes the same bundle correct everywhere.
</script>

<DocneuralApp base={import.meta.env.BASE_URL} title="docneural" />

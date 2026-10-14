import 'docneural-ui/styles/docneural-ui.css'
import { mount } from 'svelte'
import App from './App.svelte'

// The batch Emacs exporter is the ONLY path from .org to .html — this
// entry never touches Org.  Everything below is a thin host that mounts
// the docneural-ui theme against the artifacts the exporter dropped in .export/.
mount(App, { target: document.getElementById('app')! })

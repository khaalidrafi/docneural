import 'synapt/styles/synapt.css'
import { mount } from 'svelte'
import App from './App.svelte'

// The batch Emacs exporter is the ONLY path from .org to .html — this
// entry never touches Org.  Everything below is a thin host that mounts
// the synapt theme against the artifacts the exporter dropped in .export/.
mount(App, { target: document.getElementById('app')! })

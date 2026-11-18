import App from './App.uvue'
import { createSSRApp } from 'vue'
import "@/ucsDesignConfig.js"

export function createApp() {
	const app = createSSRApp(App)
	return {
		app
	}
}
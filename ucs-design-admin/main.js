import App from './App.uvue'

import { provideGlobalConfig } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/es/components/base/style/css.mjs';
import 'element-plus/theme-chalk/dark/css-vars.css';


import {
	createSSRApp
} from 'vue'
export function createApp() {
	const app = createSSRApp(App)
	provideGlobalConfig({ locale: zhCn }, app, true);
	return {
		app
	}
}

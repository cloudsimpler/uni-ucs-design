export default {
	props: {
		// 图标大小
		size: {
			type: Number,
			default: 24
		},
		// 线段粗细
		strokeWidth: {
			type: Number,
			default: 4
		},
		// 图标风格（颜色）
		theme: {
			type: String,
			default: "outline"
		},
		// 图标颜色["外部描边颜色","外部填充颜色","内部描边颜色","内部填充颜色"]
		fill: {
			type: Array,
			default: () => {
				return ["#000000"]
			}
		},
		// 端点类型
		strokeLinecap: {
			type: String,
			default: "round"
		},
		// 拐点类型
		strokeLinejoin: {
			type: String,
			default: "round"
		}
	},
	methods: {
		/**
		 * 获取当前颜色
		 */
		currentColor(index, defaultColor) {
			const isExistence = this.fill.length >= (index + 1) ? true : false;
			return isExistence ? this.fill[index] : defaultColor;
		},
		/**
		 * 多色
		 */
		multiColor() {
			return [this.currentColor(0, "#000000"), this.currentColor(1, "#2F88FF"), this.currentColor(2, "#FFFFFF"),
				this.currentColor(3, "#43CCF8")
			];
		},
		/**
		 * 双色
		 */
		twoTone() {
			return [this.currentColor(0, "#000000"), this.currentColor(1, "#2F88FF"), this.currentColor(0, "#000000"),
				this.currentColor(1, "#2F88FF")
			];
		},
		/**
		 * 填充
		 */
		filled() {
			return [this.currentColor(0, "#000000"), this.currentColor(0, "#000000"), "#FFFFFF", "#FFFFFF"];
		},
		/**
		 * 线性
		 */
		outline() {
			return [this.currentColor(0, "#000000"), "none", this.currentColor(0, "#000000"), "none"];
		},
		/**
		 * 根据主题取色彩
		 */
		colors(index) {
			if (this.theme == "filled") {
				return this.filled()[index]
			} else if (this.theme == "two-tone") {
				return this.twoTone()[index]
			} else if (this.theme == "multi-color") {
				return this.multiColor()[index]
			} else {
				return this.outline()[index]
			};
		}
	}
}
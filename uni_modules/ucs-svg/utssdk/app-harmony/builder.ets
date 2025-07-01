import { SVGImageView } from '@ohos/svg'

@Component
struct MySvg {
	private src: string = '';
	private svgWidth: number = 0;
	private svgHeight: number = 0;
	
	build() {
		SVGImageView({model: this.getModel()})
			.width(this.svgWidth)
			.height(this.svgHeight)
	}
	
	getModel() {
		let model: SVGImageView.SVGImageViewModel = new SVGImageView.SVGImageViewModel()
		model.setFromString(this.src)
		return model
	}
}

@Builder
export function buildSVG(params: ESObject) {
	if (params.src != '') {
		MySvg({src: params.src, svgWidth: params.width, svgHeight: params.height})
	} else {
		Column()
	}
}
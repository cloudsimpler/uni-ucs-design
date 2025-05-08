@Builder
export function buildImage(params: ESObject) {
	Image(params.src).width('100%').height('100%').objectFit(ImageFit.Contain).onComplete((event)=>{params.onComplete(event)}).onError((error) =>{params.onError(error.message)})
}

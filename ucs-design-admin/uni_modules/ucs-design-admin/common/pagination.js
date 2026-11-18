import {
	reactive
} from "vue";
const paginationProps = reactive({
	showTotal: true,
	showJumper: true,
	showPageSize: true,
	hideOnSinglePage: true,
	size: "small",
	total: 0,
	pageSize: 0,
	current: 0
});


const paginationAssign = (total, pageSize, current) => {
	return Object.assign(paginationProps, {
		total: total,
		pageSize: pageSize,
		current: current
	})
};



export {
	paginationAssign
}
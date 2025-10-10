<template>
	<picker-view class="picker-view" indicator-style="height: 50px;" :value="valueIndex" @change="onChange">
		<picker-view-column class="picker-view-column">
			<view class="item" v-for="(item,index) in showPicker.years" :key="index"><text class="text">{{item}}年</text>
			</view>
		</picker-view-column>
		<picker-view-column class="picker-view-column">
			<view class="item" v-for="(item,index) in showPicker.months" :key="index"><text
					class="text">{{item}}月</text>
			</view>
		</picker-view-column>
		<picker-view-column class="picker-view-column">
			<view class="item" v-for="(item,index) in showPicker.days" :key="index"><text class="text">{{item}}日</text>
			</view>
		</picker-view-column>
		<picker-view-column class="picker-view-column">
			<view class="item" v-for="(item,index) in showPicker.hours" :key="index"><text class="text">{{item}}时</text>
			</view>
		</picker-view-column>
		<picker-view-column class="picker-view-column">
			<view class="item" v-for="(item,index) in showPicker.minutes" :key="index"><text
					class="text">{{item}}分</text>
			</view>
		</picker-view-column>
		<picker-view-column class="picker-view-column">
			<view class="item" v-for="(item,index) in showPicker.seconds" :key="index"><text
					class="text">{{item}}秒</text>
			</view>
		</picker-view-column>
	</picker-view>
</template>

<script setup lang="uts">
	import { parseDateTime, defaultDateTime, currentDateTime, getDaysInMonth, getYearsList } from "./tools.uts";
	import { reactive } from "vue";

	const props = defineProps({
		start: {
			type: String,
			default: defaultDateTime('start')
		},
		end: {
			type: String,
			default: defaultDateTime('end')
		},
		value: {
			type: String,
			default: currentDateTime()
		}
	});
	// 赋值默认值下标
	let valueIndex = ref<number[]>([0, 0, 0, 0, 0, 0])

	type showPickerType = {
		years : number[];
		months : number[];
		days : number[];
		hours : number[];
		minutes : number[];
		seconds : number[];
	}

	const showPicker = reactive<showPickerType>({
		years: [],
		months: [],
		days: [],
		hours: [],
		minutes: [],
		seconds: []
	});

	const aYears = getYearsList(props.start, props.end, props.value);
	const dateTimeList = aYears['dateTimeList'] as UTSJSONObject;
	valueIndex.value = aYears['dateTimeIndex'] as number[];
	showPicker.years = dateTimeList['year'] as number[];
	showPicker.months = dateTimeList['month'] as number[];
	showPicker.days = dateTimeList['day'] as number[];
	showPicker.hours = dateTimeList['hour'] as number[];
	showPicker.minutes = dateTimeList['minute'] as number[];
	showPicker.seconds = dateTimeList['second'] as number[];


	const onChange = (e : UniPickerViewChangeEvent) => {
		const val = e.detail.value;
		console.log(`${showPicker.years[val[0]]}-${showPicker.months[val[1]]}-${showPicker.days[val[2]]} ${showPicker.hours[val[3]]}:${showPicker.minutes[val[4]]}:${showPicker.seconds[val[5]]}`)
		
		const BYears = getYearsList(props.start, props.end, `${showPicker.years[val[0]]}-${showPicker.months[val[1]]}-${showPicker.days[val[2]]} ${showPicker.hours[val[3]]}:${showPicker.minutes[val[4]]}:${showPicker.seconds[val[5]]}`);
		const BdateTimeList = BYears['dateTimeList'] as UTSJSONObject;
		console.log(valueIndex.value)
		showPicker.years = BdateTimeList['year'] as number[];
		showPicker.months = BdateTimeList['month'] as number[];
		showPicker.days = BdateTimeList['day'] as number[];
		showPicker.hours = BdateTimeList['hour'] as number[];
		showPicker.minutes = BdateTimeList['minute'] as number[];
		showPicker.seconds = BdateTimeList['second'] as number[];
		valueIndex.value = BYears['dateTimeIndex'] as number[];
	
	}
</script>

<style>
	.picker-view {
		height: 300px;
	}

	.item {
		height: 50px;
	}

	.text {
		line-height: 50px;
		text-align: center;
	}
</style>
<template>
	<picker-view class="picker-view" indicator-style="height: 50px;" @change="onChange">
		<picker-view-column class="picker-view-column">
			<view class="item" v-for="(item,index) in years" :key="index"><text class="text">{{item}}年</text></view>
		</picker-view-column>
		<picker-view-column class="picker-view-column">
			<view class="item" v-for="(item,index) in 12" :key="index"><text class="text">{{item}}月</text> </view>
		</picker-view-column>
		<picker-view-column class="picker-view-column">
			<view class="item" v-for="(item,index) in days" :key="index"><text class="text">{{item}}日</text></view>
		</picker-view-column>
		<picker-view-column class="picker-view-column">
			<view class="item" v-for="(item,index) in 24" :key="index"><text class="text">{{item}}时</text></view>
		</picker-view-column>
		<picker-view-column class="picker-view-column">
			<view class="item" v-for="(item,index) in 60" :key="index"><text class="text">{{item}}分</text></view>
		</picker-view-column>
		<picker-view-column class="picker-view-column">
			<view class="item" v-for="(item,index) in 60" :key="index"><text class="text">{{item}}秒</text></view>
		</picker-view-column>
	</picker-view>
</template>

<script setup lang="uts">
	const props = defineProps({
		mode: {
			type: Number,
			default: 0
		},
		minDate: {
			type: String,
			default: ""
		},
		maxDate: {
			type: String,
			default: ""
		},
		defaultDate: {
			type: String,
			default: ""
		}
	})

	const years = [2021, 2022, 2023];
	const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
	const days = [1, 2, 3, 4, 5, 6];

	const now = new Date();
	const year = now.getFullYear(); // 年份（4位）
	const month = now.getMonth() + 1; // 月份（0-11，需+1）
	const day = now.getDate(); // 日（1-31）
	const hours = now.getHours(); // 小时（0-23）
	const minutes = now.getMinutes(); // 分钟（0-59）
	const seconds = now.getSeconds(); // 秒（0-59）

	console.log(hours)

	// 判断是否闰年还是平年，返回2月份天数
	const getDaysInMonth = (year: number, month: number) => {
		// month 是 0-11，0 表示一月，11 表示十二月
		return new Date(year, month, 0).getDate();
	};

	// 默认年份，当前年份的前10年和后10年 
	const getYearRange = (year: number) => {
		const startYear = year - 10;
		const endYear = year + 10;
		const years: number[] = [];

		for (let i = startYear; i <= endYear; i++) {
			years.push(i);
		};

		return years;
	};

	console.log(getYearRange(2025))

	console.log(getDaysInMonth(2025, 2))


	const onChange = (e: UniPickerViewChangeEvent) => {
		console.log(e)
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
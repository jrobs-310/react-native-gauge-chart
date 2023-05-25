import * as d3 from "d3";

export const updateDimensions = (parentWidth: number): {width: number, height: number} => {
	const width = parentWidth;
	const height = width / 2;
	return {width, height};
}

export const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number): {x: number, y: number} => {
	const angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

	return {
		x: cx + (radius * Math.cos(angleInRadians)),
		y: cy + (radius * Math.sin(angleInRadians))
	};
}

export const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number): string => {
	const start = polarToCartesian(x, y, radius, endAngle);
	const end = polarToCartesian(x, y, radius, startAngle);

	const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

	return [
		"M", start.x, start.y,
		"A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
	].join(" ");
}

export const getColors = (colors: string[], nbArcsToDisplay: number): string[] => {
	if (colors.length === nbArcsToDisplay) {
		return colors;
	}
	const colorScale = d3.scaleLinear<string, string>()
		.domain([1, nbArcsToDisplay])
		.range([colors[0], colors[colors.length - 1]]) //Use the first and the last color as range
		.interpolate(d3.interpolateHsl);
	const colorArray = [];
	for (let i = 1; i <= nbArcsToDisplay; i++) {
		colorArray.push(colorScale(i));
	}
	return colorArray;
};

// Builds the gauge segments geometry
export const buildArcSegments = (numberOfSegments: number) => {
	return [...new Array(numberOfSegments).keys()].reduce((accum:{id: number, colorIndex: number, start: number, end: number}[], item: number) => {
		const gap = 2;
		const len = Math.round((180 - (gap * (numberOfSegments - 1)))/numberOfSegments);
		const revisedGap = (180 - (len * numberOfSegments))/(numberOfSegments - 1)

		const obj = {
			id: item,
			colorIndex: item,
			start: 0,
			end: 0
		}
		if (!accum.length) {
			obj.start = 270;
			obj.end = 270 + len
		} else {
			obj.start = accum[item-1].end + revisedGap;
			obj.end = accum[item-1].end + revisedGap + len;
		}
		accum.push(obj);
		return accum;
	}, []);
}

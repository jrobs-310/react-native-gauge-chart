// @ts-ignore
import React from "react";
import {View} from "react-native"
import Animated, {withSpring, useSharedValue, useDerivedValue, useAnimatedProps, withDelay} from 'react-native-reanimated'
import Svg, {G, Path, Text} from 'react-native-svg';
import { updateDimensions, describeArc, getColors, buildArcSegments } from "./utils"

type OwnProps = {
	percent: number;
	colors?: string[];
	numberOfSegments: number;
	displayValue?: string;
	title?: string;
	darkMode: boolean;
}
/**
 *
 */
const Gauge = (
	{
		percent=.1,
		colors=["#FF0000", "#00FF00"],
		numberOfSegments=3,
		displayValue = "",
		title = "",
		darkMode = false
	}: OwnProps) => {
	const [dimensions, setDimensions] = React.useState({width: 0, height: 0});
	const AnimatedPath = Animated.createAnimatedComponent(Path);
	const sv = useSharedValue(0);
	const colorArray = getColors(colors, numberOfSegments);
	const rScale = .8;
	const padding = 10;

	// animated variable for the pointer swing, uses spring effect with slight delay before it starts
	const angle = useDerivedValue(() => {
		return withDelay(500, withSpring(sv.value));
	});

	React.useEffect(() => {
		sv.value = percent > 100 ? 100 : percent < 0 ? 0 : percent;
	}, [percent]);

	// Contains the gauge segments geometry
	const arcSegments = buildArcSegments(numberOfSegments);

	// Config of the animated prop passed to the AnimatedPath component (pointer)
	// will use the derived angle value to produce the path to draw the pointer
	const animatedProps = useAnimatedProps(() => {
		// duplicated here to run on the UI thread
		const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number): {x: number, y: number} => {
			const angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

			return {
				x: cx + (radius * Math.cos(angleInRadians)),
				y: cy + (radius * Math.sin(angleInRadians))
			};
		}

		// generate the svg path command for the pointer
		const calculateRotation = (percent: number, centerX: number, centerY: number, pointerTipRadius: number, innerRadius: number): string => {
			const angle = percent < 50 ? (((percent * 2)/100) * 90) + 270 : ((percent - 50) / 50) * 90;
			// angle calc for the 2 sides of the pointer
			let rAngle = percent < 50 ? angle - 90 : angle + 90;
			let lAngle = percent < 50 ? rAngle - 180 : rAngle + 180;

			const {x, y} = polarToCartesian(centerX, centerY, pointerTipRadius, angle)
			const {x: triangleRx, y: triangleRy} = polarToCartesian(centerX, centerY, innerRadius, rAngle);
			const {x: triangleLx, y: triangleLy} = polarToCartesian(centerX, centerY, innerRadius, lAngle);
			return [
				"M", x, y,
				"L", triangleRx, triangleRy,
				"L", triangleLx, triangleLy,
				"Z"
			].join(" ");
		}
		return {
			d: calculateRotation(angle.value, dimensions.width/2, dimensions.height * rScale, dimensions.height * .6, 4)
		}
	})

	return (
		<View
			style={{flex: 1}}
			onLayout={(event) => {
				let {width} = event.nativeEvent.layout;
				const dims = updateDimensions(width);
				setDimensions(dims);
			}}
		>
			{!!dimensions.height && !!dimensions.width &&
				<Svg
					height={dimensions.height + 25}
					width={dimensions.width}
					viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
				>
					<G>
						{/* Animated Pointer Triangle */}
						<AnimatedPath
							animatedProps={animatedProps}
							stroke={darkMode ? "#989595" : "#ccc"}
							fill={darkMode ? "#989595": "#ccc"}
						/>
						{/* Pointer center circle */}
						<Path
							d={describeArc(dimensions.width/2, dimensions.height * rScale, 4, 1, 360)}
							stroke={darkMode ? "#989595" : "#ccc"}
							fill={darkMode ? "#989595": "#ccc"}
						/>
						{/* Metric value displayed in Arc */}
						{displayValue &&
							<Text
								fill={darkMode ? "#fff" : "#474a47"}
								stroke={darkMode ? "#fff" : "#474a47"}
								x={dimensions.width * .5}
								y={dimensions.height * .5}
								fontSize={20}
								textAnchor={"middle"}
							>
								{displayValue}
							</Text>
						}
						{/* Metric title below chart */}
						{title &&
							<Text
								fill={darkMode ? "#fff" : "#474a47"}
								stroke={darkMode ? "#fff" : "#474a47"}
								x={dimensions.width * .5}
								y={dimensions.height + 10}
								fontSize={14}
								textAnchor={"middle"}
							>
								{title}
							</Text>
						}
						{/* Colored Arc Segments */}
						{arcSegments && arcSegments.map((item) => {
							return (
								<Path
									key={item.id}
									d={describeArc(dimensions.width/2,
										dimensions.height * rScale,
										(dimensions.height * rScale) - padding,
										item.start,
										item.end
									)}
									stroke={colorArray[item.colorIndex]}
									strokeWidth={10}
									strokeLinecap={"butt"}
								/>
							)
						})}
					</G>
				</Svg>
			}
		</View>
	);
}

Gauge.displayName = "Gauge";
export default Gauge;

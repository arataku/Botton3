export function average(array: Array<number>) {
	let sum = 0;
	for (let value of array) {
		sum += value;
	}
	return sum / array.length;
}

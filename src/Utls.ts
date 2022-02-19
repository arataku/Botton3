export function average(array: Array<number>) {
	let sum = 0;
	for (let value of array) {
		sum += value;
	}
	return sum / array.length;
}

export async function sleep(waitTime: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, waitTime));
}

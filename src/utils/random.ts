export function shuffleArray(array: Array<any>) {
    const shuffledArray = array.slice(0);
    let currentIndex = shuffledArray.length;

    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [shuffledArray[currentIndex], shuffledArray[randomIndex]] = [
            shuffledArray[randomIndex],
            shuffledArray[currentIndex],
        ];
    }
    return shuffledArray;
}

export function randomSelect<T>(array: Array<T>): T {
    return array[Math.floor(Math.random() * array.length)];
}

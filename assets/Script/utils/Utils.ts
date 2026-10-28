export class Utils {
    public static buildName(base: string, className: string) {
        return `${base}_${className}_${Date.now()}_${Math.random()}`;
    }

    public static formatValue(num: number): string {
        if (num < 0) {
            return '-' + this.formatValue(-num);
        }

        if (num < 1) {
            if (num === 0) {
                return '0';
            }
            return (Math.round(num * 100) / 100).toString();
        }

        if (num < 1000) {
            return Math.round(num).toString();
        }

        const suffixes = [
            {threshold: 1e3, suffix: 'K'},
            {threshold: 1e6, suffix: 'M'},
            {threshold: 1e9, suffix: 'B'},
            {threshold: 1e12, suffix: 'T'},
            {threshold: 1e15, suffix: 'Qa'},
            {threshold: 1e18, suffix: 'Qi'},
            {threshold: 1e21, suffix: 'Sx'}
        ]

        let selectedIndex = suffixes.length - 1;
        for (let i = suffixes.length - 1; i >= 0; i--) {
            if (num >= suffixes[i].threshold) {
                selectedIndex = i;
                break;
            }
        }

        // Round to 3 significant figures. If the rounded value overflows into the
        // next unit (e.g. 999.999K -> 1M), promote the suffix instead of emitting
        // scientific notation or an intermediate value.
        while (selectedIndex < suffixes.length - 1) {
            const candidate = suffixes[selectedIndex];
            const rounded = parseFloat((num / candidate.threshold).toPrecision(3));
            if (rounded < 1000) {
                break;
            }
            selectedIndex++;
        }

        const selected = suffixes[selectedIndex];
        const rounded = parseFloat((num / selected.threshold).toPrecision(3));
        return rounded.toString() + selected.suffix;
    }
}
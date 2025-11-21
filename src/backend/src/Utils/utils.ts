export default new class Function {
    public ucword(input: string = ''): string {
        if (!input.trim()) return ''

        return input.toLowerCase().replace(/\b\w/g, (char: string) => char.toUpperCase())
    }
}
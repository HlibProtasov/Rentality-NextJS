export function updateDate(from: Date, to: Date): Date {
    const fromOffset = from.getTimezoneOffset()
    const toOffset = to.getTimezoneOffset()

        if(fromOffset < toOffset) {
         to.setHours(to.getHours() - 1)
        }
    return to
}
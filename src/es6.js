const decorator = (target, key, descriptor) => {
    target[key] = function (...args) {
        console.log(this.count);
        return descriptor.value.apply(this, args)
    }
    return target[key]
}

export default class CountChange {
    count = 1

    @decorator
    increment() {
        this.count++
    }

    decrease = () => {
        this.count--
    }
}
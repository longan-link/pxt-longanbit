![](https://img.shields.io/badge/Plantfrom-Micro%3Abit-red) ![](https://img.shields.io/travis/com/longan-link/pxt-longanbit) ![](https://img.shields.io/github/v/release/longan-link/pxt-longanbit) ![](https://img.shields.io/github/last-commit/longan-link/pxt-longanbit) ![](https://img.shields.io/github/languages/top/longan-link/pxt-longanbit) ![](https://img.shields.io/github/issues/longan-link/pxt-longanbit) ![](https://img.shields.io/github/license/longan-link/pxt-longanbit) 

# Longanbit Package

The product is designed for teaching fundamentals of robotics and AI from kids from kindergarten age to twelfth grade.  It contains the Wukong board from Elecfreaks, many sensors and four servos.  A whole curriculum will be built around it.

![](/images.png/)

This extension is designed to programme and drive the Longanbit, You can [get longanbit from the here](https://item.taobao.com/item.htm?id=616384887720)

## More information

The educational resources will be shown on [http://learn.longan.link](http://learn.longan.link)

## Code Example
```JavaScript

basic.forever(function () {
    if (Longan.crashSensor(DigitalPin.P2)) {
        Longan.stopMotor(Longan.MotorList.M1)
    } else {
        basic.showNumber(Longan.ReadSoilHumidity(AnalogPin.P1))
    }
})



```
## Supported targets

* for PXT/microbit

## License
MIT


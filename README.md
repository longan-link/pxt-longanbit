![](https://img.shields.io/badge/Plantfrom-Micro%3Abit-red) ![](https://img.shields.io/travis/com/longan-link/pxt-longanbit) ![](https://img.shields.io/github/v/release/longan-link/pxt-longanbit) ![](https://img.shields.io/github/last-commit/longan-link/pxt-longanbit) ![](https://img.shields.io/github/languages/top/longan-link/pxt-longanbit) ![](https://img.shields.io/github/issues/longan-link/pxt-longanbit) ![](https://img.shields.io/github/license/longan-link/pxt-longanbit) 

# Longanbit Package

![](/images.png/)

This extension is designed to programme and drive the Longanbit, You can [get longanbit from the here](https://www.longan-link.com/store)

## Code Example
```JavaScript

Longan.crashSensorSetup(DigitalPin.P0)
basic.forever(function () {
    if (Longan.crashSensor()) {
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


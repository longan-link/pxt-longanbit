basic.forever(function () {
    if (Longan.crashSensor(DigitalPin.P2)) {
        Longan.stopMotor(Longan.MotorList.M1)
    } else {
        basic.showNumber(Longan.ReadSoilHumidity(AnalogPin.P1))
    }
})

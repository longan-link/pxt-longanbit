Longan.crashSensorSetup(DigitalPin.P0)
basic.forever(function () {
    if (Longan.crashSensor()) {
        Longan.stopMotor(Longan.MotorList.M1)
    } else {
        basic.showNumber(Longan.ReadSoilHumidity(AnalogPin.P1))
    }
})

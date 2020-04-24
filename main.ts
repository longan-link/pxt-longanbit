/**
* Functions to longan
*/
//% color=#3669a6  icon="\uf0b2" block="Longan" blockId="Longan" weight=7
namespace Longan {
    const board_address = 0x10
    // BME280 Addresses
    let BME280_I2C_ADDR = 0x76
    let dig_T1 = getUInt16LE(0x88)
    let dig_T2 = getInt16LE(0x8A)
    let dig_T3 = getInt16LE(0x8C)
    let dig_P1 = getUInt16LE(0x8E)
    let dig_P2 = getInt16LE(0x90)
    let dig_P3 = getInt16LE(0x92)
    let dig_P4 = getInt16LE(0x94)
    let dig_P5 = getInt16LE(0x96)
    let dig_P6 = getInt16LE(0x98)
    let dig_P7 = getInt16LE(0x9A)
    let dig_P8 = getInt16LE(0x9C)
    let dig_P9 = getInt16LE(0x9E)
    let dig_H1 = getreg(0xA1)
    let dig_H2 = getInt16LE(0xE1)
    let dig_H3 = getreg(0xE3)
    let a = getreg(0xE5)
    let dig_H4 = (getreg(0xE4) << 4) + (a % 16)
    let dig_H5 = (getreg(0xE6) << 4) + (a >> 4)
    let dig_H6 = getInt8LE(0xE7)
    let T = 0
    let P = 0
    let H = 0
    setreg(0xF2, 0x04)
    setreg(0xF4, 0x2F)
    setreg(0xF5, 0x0C)
    setreg(0xF4, 0x2F)

    // Stores compensation values for Temperature (must be read from BME280 NVM)
    let digT1Val = 0
    let digT2Val = 0
    let digT3Val = 0

    // Stores compensation values for humidity (must be read from BME280 NVM)
    let digH1Val = 0
    let digH2Val = 0
    let digH3Val = 0
    let digH4Val = 0
    let digH5Val = 0
    let digH6Val = 0

    // Buffer to hold pressure compensation values to pass to the C++ compensation function
    let digPBuf: Buffer

    // BME Compensation Parameter Addresses for Temperature
    const digT1 = 0x88
    const digT2 = 0x8A
    const digT3 = 0x8C

    // BME Compensation Parameter Addresses for Pressure
    const digP1 = 0x8E
    const digP2 = 0x90
    const digP3 = 0x92
    const digP4 = 0x94
    const digP5 = 0x96
    const digP6 = 0x98
    const digP7 = 0x9A
    const digP8 = 0x9C
    const digP9 = 0x9E

    // BME Compensation Parameter Addresses for Humidity
    const digH1 = 0xA1
    const digH2 = 0xE1
    const digH3 = 0xE3
    const e5Reg = 0xE5
    const e4Reg = 0xE4
    const e6Reg = 0xE6
    const digH6 = 0xE7

    function setreg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(BME280_I2C_ADDR, buf);
    }

    function getreg(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.UInt8BE);
    }

    function getInt8LE(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.Int8LE);
    }

    function getUInt16LE(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.UInt16LE);
    }

    function getInt16LE(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.Int16LE);
    }
    function get(): void {
        let adc_T = (getreg(0xFA) << 12) + (getreg(0xFB) << 4) + (getreg(0xFC) >> 4)
        let var1 = (((adc_T >> 3) - (dig_T1 << 1)) * dig_T2) >> 11
        let var2 = (((((adc_T >> 4) - dig_T1) * ((adc_T >> 4) - dig_T1)) >> 12) * dig_T3) >> 14
        let t = var1 + var2
        T = ((t * 5 + 128) >> 8) / 100
        var1 = (t >> 1) - 64000
        var2 = (((var1 >> 2) * (var1 >> 2)) >> 11) * dig_P6
        var2 = var2 + ((var1 * dig_P5) << 1)
        var2 = (var2 >> 2) + (dig_P4 << 16)
        var1 = (((dig_P3 * ((var1 >> 2) * (var1 >> 2)) >> 13) >> 3) + (((dig_P2) * var1) >> 1)) >> 18
        var1 = ((32768 + var1) * dig_P1) >> 15
        if (var1 == 0)
            return; // avoid exception caused by division by zero
        let adc_P = (getreg(0xF7) << 12) + (getreg(0xF8) << 4) + (getreg(0xF9) >> 4)
        let _p = ((1048576 - adc_P) - (var2 >> 12)) * 3125
        _p = (_p / var1) * 2;
        var1 = (dig_P9 * (((_p >> 3) * (_p >> 3)) >> 13)) >> 12
        var2 = (((_p >> 2)) * dig_P8) >> 13
        P = _p + ((var1 + var2 + dig_P7) >> 4)
        let adc_H = (getreg(0xFD) << 8) + getreg(0xFE)
        var1 = t - 76800
        var2 = (((adc_H << 14) - (dig_H4 << 20) - (dig_H5 * var1)) + 16384) >> 15
        var1 = var2 * (((((((var1 * dig_H6) >> 10) * (((var1 * dig_H3) >> 11) + 32768)) >> 10) + 2097152) * dig_H2 + 8192) >> 14)
        var2 = var1 - (((((var1 >> 15) * (var1 >> 15)) >> 7) * dig_H1) >> 4)
        if (var2 < 0) var2 = 0
        if (var2 > 419430400) var2 = 419430400
        H = (var2 >> 12) / 1024
    }

    export enum DHT11Type {
        //% block="temperature(℃)" enumval=0
        DHT11_temperature_C,

        //% block="temperature(℉)" enumval=1
        DHT11_temperature_F,

        //% block="humidity(0~100)" enumval=2
        DHT11_humidity,
    }
    export enum Distance_Unit {
        //% block="mm" enumval=0
        Distance_Unit_mm,

        //% block="cm" enumval=1
        Distance_Unit_cm,

        //% block="inch" enumval=2
        Distance_Unit_inch,
    }
    export enum BME280_state {
        //% block="temperature(℃)" enumval=0
        BME280_temperature_C,

        //% block="humidity(0~100)" enumval=1
        BME280_humidity,

        //% block="pressure(hPa)" enumval=2
        BME280_pressure,

        //% block="altitude(M)" enumval=3
        BME280_altitude,
    }
    export enum ADKeys {
        A = 1,
        B = 2,
        C = 3,
        D = 4,
        E = 5
    }

    export enum RelayStateList {
        //% block="NC|Close NO|Open"
        On,

        //% block="NC|Open NO|Close"
        Off
    }
    export enum GeneralStateList {
        //% block="On"
        On,

        //% block="Off"
        Off
    }
	/**
	* LightMode
	*/
    export enum LightMode {
        //% block="BREATH"
        BREATH,
        //% block="OFF"
        OFF
    }
	/**
	* MotorList
	*/
    export enum MotorList {
        //% block="M1"
        M1,
        //% block="M2"
        M2
    }
	/**
	* ServoList
	*/
    export enum ServoList {
        //% block="S0" enumval=0
        S0,
        //% block="S1" enumval=1
        S1,
        //% block="S2" enumval=2
        S2,
        //% block="S3" enumval=3
        S3,
        //% block="S4" enumval=4
        S4,
        //% block="S5" enumval=5
        S5,
        //% block="S6" enumval=6
        S6,
        //% block="S7" enumval=7
        S7
    }



	/**
     * TODO: Set the speed of M1 or M2 motor. 
     * @param motor M1 or M2 motor , eg: MotorList.M1
     * @param speed motor speed, eg: 100
     */
    //% weight=88
    //% blockId=setMotorSpeed block="Set motor %motor speed to %speed"
    //% speed.min=-100 speed.max=100
    //% subcategory=Move group="Basic"
    export function setMotorSpeed(motor: MotorList, speed: number): void {
        let buf = pins.createBuffer(4);
        switch (motor) {
            case MotorList.M1:
                buf[0] = 0x01;
                buf[1] = 0x01;
                if (speed < 0) {
                    buf[1] = 0x02;
                    speed = speed * -1
                }
                buf[2] = speed;
                buf[3] = 0;
                pins.i2cWriteBuffer(board_address, buf);
                break;
            case MotorList.M2:
                buf[0] = 0x02;
                buf[1] = 0x01;
                if (speed < 0) {
                    buf[1] = 0x02;
                    speed = speed * -1
                }
                buf[2] = speed;
                buf[3] = 0;
                pins.i2cWriteBuffer(board_address, buf);
                break;
            default:
                break;
        }
    }
	/*
     * TODO: Set both of M1 and M2 motors speed. 
     * @param m1speed M1 motor speed , eg: 100
     * @param m2speed M2 motor speed, eg: -100
     */
    //% weight=87
    //% blockId=setAllMotor block="set motor M1 speed %m1speed M2 speed %m2speed"
    //% m1speed.min=-100 m1speed.max=100
    //% m2speed.min=-100 m2speed.max=100
    //% subcategory=Move group="Basic"
    export function setAllMotor(m1speed: number, m2speed: number): void {
        setMotorSpeed(MotorList.M1, m1speed)
        setMotorSpeed(MotorList.M2, m2speed)
    }

	/*
     * TODO: Stop one of the motors. 
     * @param motor A motor in the MotorList , eg: MotorList.M1
     */
    //% weight=86
    //% blockId=stopMotor block="Stop motor %motor"
    //% subcategory=Move group="Basic"
    export function stopMotor(motor: MotorList): void {
        setMotorSpeed(motor, 0)
    }
	/*
     * TODO: Stop all motors, including M1 and M2.
     */
    //% weight=85
    //% blockId=stopAllMotor  block="Stop all motor"
    //% subcategory=Move group="Basic"
    export function stopAllMotor(): void {
        setMotorSpeed(MotorList.M1, 0)
        setMotorSpeed(MotorList.M2, 0)
    }

	/*
     * TODO: Setting the angle of a servo motor. 
     * @param servo A servo in the ServoList , eg: ServoList.S1
     * @param angel Angle of servo motor , eg: 90
     */
    //% weight=84
    //% blockId=setServoAngel block="Set servo %servo angel to %angle"
    //% angle.shadow="protractorPicker"
    //% subcategory=Move group="Basic"
    export function setServoAngel(servo: ServoList, angel: number): void {
        let buf = pins.createBuffer(4);
        if (servo == 0) {
            buf[0] = 0x03;
        }
        if (servo == 1) {
            buf[0] = 0x04;
        }
        if (servo == 2) {
            buf[0] = 0x05;
        }
        if (servo == 3) {
            buf[0] = 0x06;
        }
        if (servo == 4) {
            buf[0] = 0x07;
        }
        if (servo == 5) {
            buf[0] = 0x08;
        }
        if (servo == 6) {
            buf[0] = 0x09;
        }
        if (servo == 7) {
            buf[0] = 0x10;
        }
        buf[1] = angel;
        buf[2] = 0;
        buf[3] = 0;
        pins.i2cWriteBuffer(board_address, buf);
    }
    /***************************************************Mecanum wheel car******************************************/
    let LeftFront_def = ServoList.S0
    let LeftRear_def = ServoList.S1
    let RightFront_def = ServoList.S2
    let RightRear_def = ServoList.S3
    /**
    * ServoList
    */
    export enum WheelList {
        //% block="Left Front" 
        LeftFront_def,
        //% block="Left Rear"
        LeftRear_def,
        //% block="Right Front"
        RightFront_def,
        //% block="Right Rear"
        RightRear_def
    }
    /**
     * SideList
     */
    export enum SideList {
        //% block="Left Side"
        Left_Side,
        //% block="Right Side"
        Right_Side
    }
    /**
     * 8 run
     */
    export enum RunList {
        //% block="↖" 
        LeftFront,
        //% block="↑"
        Front,
        //% block="↗"
        RightFront,
        //% block="←"
        left,
        //% block="P" 
        stop,
        //% block="→"
        right,
        //% block="↙"
        LeftRear,
        //% block="↓"
        rear,
        //% block="↘"
        RightRear
    }
    export enum TurnList {
        //% block="Left" 
        Left,
        //% block="Right"
        Right
    }
    /**
    * TODO: Set Mecanum wheel car 
    * @param LeftFront A servo in the ServoList , eg: wuKong.ServoList.S1
    * @param LeftRear A servo in the ServoList , eg: wuKong.ServoList.S2
    * @param RightFront A servo in the ServoList , eg: wuKong.ServoList.S3
    * @param RightRear A servo in the ServoList , eg: wuKong.ServoList.S4
    */
    //% block="Set Mecanum wheel|Left Front %LeftFront|Left Rear %LeftRear|Right Front %RightFront|Right Rear %RightRear"
    //% subcategory=Move group="Mecanum"
    export function mecanumWheel(LeftFront: ServoList, LeftRear: ServoList, RightFront: ServoList, RightRear: ServoList): void {
        LeftFront_def = LeftFront
        LeftRear_def = LeftRear
        RightFront_def = RightFront
        RightRear_def = RightRear
    }

    /**
    * TODO: Set servo speed
    */
    //% block="Set %wheel wheel speed to %speed"
    //% subcategory=Move group="Mecanum"
    export function mecanumSpeed(wheel: WheelList, speed: number): void {
        let buf = pins.createBuffer(4)
        if (wheel < 2) {
            if (speed == 0) {
                speed = 89
            }
            else {
                if (speed > 0) {
                    speed = Math.map(speed, 1, 100, 90, 180)
                }
                if (speed < 0) {
                    speed = speed * -1
                    speed = Math.map(speed, 1, 100, 90, 0)
                }
            }
        }
        else {
            if (speed == 0) {
                speed = 89
            }
            else {
                if (speed > 0) {
                    speed = Math.map(speed, 1, 100, 90, 0)
                }
                if (speed < 0) {
                    speed = speed * -1
                    speed = Math.map(speed, 1, 100, 90, 180)
                }
            }
        }

        switch (wheel) {
            case 0:
                if (LeftFront_def == 0) {
                    buf[0] = 0x03;
                    break;
                }
                if (LeftFront_def == 1) {
                    buf[0] = 0x04;
                    break;
                }
                if (LeftFront_def == 2) {
                    buf[0] = 0x05;
                    break;
                }
                if (LeftFront_def == 3) {
                    buf[0] = 0x06;
                    break;
                }
                if (LeftFront_def == 4) {
                    buf[0] = 0x07;
                    break;
                }
                if (LeftFront_def == 5) {
                    buf[0] = 0x08;
                    break;
                }
                if (LeftFront_def == 6) {
                    buf[0] = 0x09;
                    break;
                }
                if (LeftFront_def == 7) {
                    buf[0] = 0x10;
                    break;
                }
            case 1:
                if (LeftRear_def == 0) {
                    buf[0] = 0x03;
                    break;
                }
                if (LeftRear_def == 1) {
                    buf[0] = 0x04;
                    break;
                }
                if (LeftRear_def == 2) {
                    buf[0] = 0x05;
                    break;
                }
                if (LeftRear_def == 3) {
                    buf[0] = 0x06;
                    break;
                }
                if (LeftRear_def == 4) {
                    buf[0] = 0x07;
                    break;
                }
                if (LeftRear_def == 5) {
                    buf[0] = 0x08;
                    break;
                }
                if (LeftRear_def == 6) {
                    buf[0] = 0x09;
                    break;
                }
                if (LeftRear_def == 7) {
                    buf[0] = 0x10;
                    break;
                }
            case 2:
                if (RightFront_def == 0) {
                    buf[0] = 0x03;
                    break;
                }
                if (RightFront_def == 1) {
                    buf[0] = 0x04;
                    break;
                }
                if (RightFront_def == 2) {
                    buf[0] = 0x05;
                    break;
                }
                if (RightFront_def == 3) {
                    buf[0] = 0x06;
                    break;
                }
                if (RightFront_def == 4) {
                    buf[0] = 0x07;
                    break;
                }
                if (RightFront_def == 5) {
                    buf[0] = 0x08;
                    break;
                }
                if (RightFront_def == 6) {
                    buf[0] = 0x09;
                    break;
                }
                if (RightFront_def == 7) {
                    buf[0] = 0x10;
                    break;
                }
            case 3:
                if (RightRear_def == 0) {
                    buf[0] = 0x03;
                    break;
                }
                if (RightRear_def == 1) {
                    buf[0] = 0x04;
                    break;
                }
                if (RightRear_def == 2) {
                    buf[0] = 0x05;
                    break;
                }
                if (RightRear_def == 3) {
                    buf[0] = 0x06;
                    break;
                }
                if (RightRear_def == 4) {
                    buf[0] = 0x07;
                    break;
                }
                if (RightRear_def == 5) {
                    buf[0] = 0x08;
                    break;
                }
                if (RightRear_def == 6) {
                    buf[0] = 0x09;
                    break;
                }
                if (RightRear_def == 7) {
                    buf[0] = 0x10;
                    break;
                }
        }
        buf[1] = speed;
        buf[2] = 0;
        buf[3] = 0;
        pins.i2cWriteBuffer(board_address, buf);
    }
    /**
    * TODO: Set side servo speed
    */
    //% block="Set %wheelside wheel speed to %speed"
    //% subcategory=Move group="Mecanum"
    export function mecanumSideRun(wheelside: SideList, speed: number): void {
        switch (wheelside) {
            case 0:
                mecanumSpeed(WheelList.LeftFront_def, speed)
                mecanumSpeed(WheelList.LeftRear_def, speed)
                break;
            case 1:
                mecanumSpeed(WheelList.RightFront_def, speed)
                mecanumSpeed(WheelList.RightRear_def, speed)
                break;
        }
    }
    /**
   * TODO: Set car runs direction
   */
    //% block="Set Mecanum car runs direction %type with speed %speed"
    //% subcategory=Move group="Mecanum"
    //% type.fieldEditor="gridpicker"
    //% type.fieldOptions.columns=3
    //% speed.min=0 speed.max=100
    export function mecanumRun(type: RunList, speed: number): void {
        let servospeed: number = 0;
        if (speed < 0) {
            speed = 0;
        }
        servospeed = Math.map(speed, 0, 100, 90, 0)
        Math.floor(servospeed)
        switch (type) {
            case 0:
                setServoAngel(LeftFront_def, 90)
                setServoAngel(LeftRear_def, 180 - servospeed)
                setServoAngel(RightFront_def, servospeed + 0)
                setServoAngel(RightRear_def, 90)
                break;
            case 1:
                setServoAngel(LeftFront_def, 180 - servospeed)
                setServoAngel(LeftRear_def, 180 - servospeed)
                setServoAngel(RightFront_def, servospeed + 0)
                setServoAngel(RightRear_def, servospeed + 0)
                break;
            case 2:
                setServoAngel(LeftFront_def, 180 - servospeed)
                setServoAngel(LeftRear_def, 90)
                setServoAngel(RightFront_def, 90)
                setServoAngel(RightRear_def, servospeed + 0)
                break;
            case 3:
                setServoAngel(LeftFront_def, servospeed + 0)
                setServoAngel(LeftRear_def, 180 - servospeed)
                setServoAngel(RightFront_def, servospeed + 0)
                setServoAngel(RightRear_def, 180 - servospeed)
                break;
            case 4:
                setServoAngel(LeftFront_def, 90)
                setServoAngel(LeftRear_def, 90)
                setServoAngel(RightFront_def, 90)
                setServoAngel(RightRear_def, 90)
                break;
            case 5:
                setServoAngel(LeftFront_def, 180 - servospeed)
                setServoAngel(LeftRear_def, servospeed + 0)
                setServoAngel(RightFront_def, 180 - servospeed)
                setServoAngel(RightRear_def, servospeed + 0)
                break;
            case 6:
                setServoAngel(LeftFront_def, servospeed + 0)
                setServoAngel(LeftRear_def, 90)
                setServoAngel(RightFront_def, 90)
                setServoAngel(RightRear_def, 180 - servospeed)
                break;
            case 7:
                setServoAngel(LeftFront_def, servospeed + 0)
                setServoAngel(LeftRear_def, servospeed + 0)
                setServoAngel(RightFront_def, 180 - servospeed)
                setServoAngel(RightRear_def, 180 - servospeed)
                break;
            case 8:
                setServoAngel(LeftFront_def, 90)
                setServoAngel(LeftRear_def, servospeed + 0)
                setServoAngel(RightFront_def, 180 - servospeed)
                setServoAngel(RightRear_def, 90)
                break;
        }
    }
    /**
    * TODO: Set Mecanum car Stop
    */
    //% block="Set Mecanum car Stop"
    //% subcategory=Move group="Mecanum"
    export function mecanumStop(): void {
        setServoAngel(LeftFront_def, 90)
        setServoAngel(LeftRear_def, 90)
        setServoAngel(RightFront_def, 90)
        setServoAngel(RightRear_def, 90)
    }
    /**
   * TODO: Set car spin 
   */
    //% block="Set Mecanum car spin %Turn with speed %speed"
    //% subcategory=Move group="Mecanum"
    //% Turn.fieldEditor="gridpicker"
    //% Turn.fieldOptions.columns=2
    //% speed.min=0 speed.max=100
    export function mecanumSpin(Turn: TurnList, speed: number): void {
        let servospeed: number = 0;
        if (speed < 0) {
            speed = 0;
        }
        servospeed = Math.map(speed, 0, 100, 90, 0)
        Math.floor(servospeed)
        switch (Turn) {
            case 0:
                setServoAngel(LeftFront_def, 0 + servospeed)
                setServoAngel(LeftRear_def, 0 + servospeed)
                setServoAngel(RightFront_def, 0 + servospeed)
                setServoAngel(RightRear_def, 0 + servospeed)
                break;
            case 1:
                setServoAngel(LeftFront_def, 180 - servospeed)
                setServoAngel(LeftRear_def, 180 - servospeed)
                setServoAngel(RightFront_def, 180 - servospeed)
                setServoAngel(RightRear_def, 180 - servospeed)
                break;
        }
    }
    /**
   * TODO: Set car drift
   */
    //% block="Set Mecanum car drift %Turn"
    //% subcategory=Move group="Mecanum"
    //% Turn.fieldEditor="gridpicker"
    //% Turn.fieldOptions.columns=2
    export function mecanumDrift(Turn: TurnList): void {
        switch (Turn) {
            case 0:
                setServoAngel(LeftFront_def, 70)
                setServoAngel(LeftRear_def, 180)
                setServoAngel(RightFront_def, 70)
                setServoAngel(RightRear_def, 180)
                break;
            case 1:
                setServoAngel(LeftFront_def, 110)
                setServoAngel(LeftRear_def, 0)
                setServoAngel(RightFront_def, 110)
                setServoAngel(RightRear_def, 0)
                break;
        }
    }

    let Reference_VOLTAGE = 3100
    /**
    * TODO: Checks whether the crash sensor is currently pressed.
    */
    //% blockId=octopus_crash
    //% subcategory=Sensor
    //% block="at pin %pin Crash Sensor is pressed"
    export function crashSensor(pin: DigitalPin): boolean {
	pins.setPull(pin, PinPullMode.PullUp)
        if (pins.digitalReadPin(pin) == 0) {
            return true
        }
        else {
            return false
        }
    }

    /**
    * TODO: get soil moisture(0~100%)
    * @param soilmoisturepin describe parameter here, eg: AnalogPin.P1
    */
    //% subcategory=Sensor  
    //% blockId="readsoilmoisture" block="value of soil moisture(0~100) at pin %soilhumiditypin"
    export function ReadSoilHumidity(soilmoisturepin: AnalogPin): number {
        let voltage = 0;
        let soilmoisture = 0;
        voltage = pins.map(
            pins.analogReadPin(soilmoisturepin),
            0,
            1023,
            0,
            100
        );
        soilmoisture = voltage;
        return Math.round(soilmoisture);
    }

    /**
    * TODO: get light intensity(0~100%)
    * @param lightintensitypin describe parameter here, eg: AnalogPin.P1
    */
    //% subcategory=Sensor  
    //% blockId="readlightintensity" block="value of light intensity(0~100) at pin %lightintensitypin"
    export function ReadLightIntensity(lightintensitypin: AnalogPin): number {
        let voltage = 0;
        let lightintensity = 0;
        voltage = pins.map(
            pins.analogReadPin(lightintensitypin),
            0,
            1023,
            0,
            100
        );
        lightintensity = voltage;
        return Math.round(lightintensity);
    }


    /** 
    * TODO: get noise(dB)
    * @param noisepin describe parameter here, eg: AnalogPin.P1
    */
    //% subcategory=Sensor  
    //% blockId="readnoise" block="value of noise(dB) at pin %noisepin"
    export function ReadNoise(noisepin: AnalogPin): number {
        let level = 0
        let voltage = 0
        let noise = 0
        let h = 0
        let l = 0
        let sumh = 0
        let suml = 0
        pins.digitalWritePin(DigitalPin.P0, 0)
        for (let i = 0; i < 1000; i++) {
            level = level + pins.analogReadPin(noisepin)
        }
        level = level / 1000
        for (let i = 0; i < 1000; i++) {
            voltage = pins.analogReadPin(noisepin)
            if (voltage >= level) {
                h += 1
                sumh = sumh + voltage
            } else {
                l += 1
                suml = suml + voltage
            }
        }
        if (h == 0) {
            sumh = level
        } else {
            sumh = sumh / h
        }
        if (l == 0) {
            suml = level
        } else {
            suml = suml / l
        }
        noise = sumh - suml
        if (noise <= 4) {
            noise = pins.map(
                noise,
                0,
                4,
                30,
                50
            )
        } else if (noise <= 8) {
            noise = pins.map(
                noise,
                4,
                8,
                50,
                55
            )
        } else if (noise <= 14) {
            noise = pins.map(
                noise,
                9,
                14,
                55,
                60
            )
        } else if (noise <= 32) {
            noise = pins.map(
                noise,
                15,
                32,
                60,
                70
            )
        } else if (noise <= 60) {
            noise = pins.map(
                noise,
                33,
                60,
                70,
                75
            )
        } else if (noise <= 100) {
            noise = pins.map(
                noise,
                61,
                100,
                75,
                80
            )
        } else if (noise <= 150) {
            noise = pins.map(
                noise,
                101,
                150,
                80,
                85
            )
        } else if (noise <= 231) {
            noise = pins.map(
                noise,
                151,
                231,
                85,
                90
            )
        } else {
            noise = pins.map(
                noise,
                231,
                1023,
                90,
                120
            )
        }
        noise = Math.round(noise)
        return Math.round(noise)
    }

    /**
    Checks if the specified key on the ADkeyboard is pressed.
    */
    //% subcategory=Input
    //% blockId=octopus_adkeyboard
    //% block="ADKeyboard at pin %p | key %k is pressed "
    export function ADKeyboard(p: AnalogPin, k: ADKeys): boolean {
        let a: number = pins.analogReadPin(p);
        if (a < 10 && k == 1) {
            return true;
        } else if (a >= 40 && a <= 60 && k == 2) {
            return true;
        } else if (a >= 80 && a <= 110 && k == 3) {
            return true;
        } else if (a >= 130 && a <= 150 && k == 4) {
            return true;
        } else if (a >= 530 && a <= 560 && k == 5) {
            return true;
        } else return false;
    }

    /**
   Checks whether the motion sensor is currently detecting any motion.
     */
    //% subcategory=Sensor  
    //% blockId=octopus_pir
    //% block="motion detector at pin %p | detects motion"
    export function PIR(p: DigitalPin): boolean {
        let a: number = pins.digitalReadPin(p);
        if (a == 1) {
            return true;
        } else return false;
    }

    /**
     * get Ultrasonic(sonar:bit) distance
     * @param distance_unit describe parameter here, eg: 1
     * @param pin describe parameter here, eg: DigitalPin.P16
     */
    //% subcategory=Sensor  
    //% blockId=readsonarbit block="Ultrasonic at Trig %trig Echo %echo distance in unit %distance_unit "
    export function sonarbit_distance(trig: DigitalPin, echo: DigitalPin,distance_unit: Distance_Unit): number {
        // send pulse
        pins.setPull(trig, PinPullMode.PullNone)
        pins.digitalWritePin(trig, 0);
        control.waitMicros(2);
        pins.digitalWritePin(trig, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trig, 0);

        // read pulse
        let d = pins.pulseIn(echo, PulseValue.High, 23000)  // 8 / 340 = 
        let distance = d * 10 * 5 / 3 / 58

        if (distance > 4000) distance = 0

        switch (distance_unit) {
            case 0:
                return Math.round(distance) //mm
                break
            case 1:
                return Math.round(distance / 10)  //cm
                break
            case 2:
                return Math.round(distance / 25)  //inch
                break
            default:
                return 0

        }

    }


    /**
     * get dht11 temperature and humidity Value
     * @param dht11pin describe parameter here, eg: DigitalPin.P15     
     */
    //% subcategory=Sensor  
    //% blockId="readdht11" block="at pin %dht11pin value of dht11 %dht11type|"
    export function dht11value(dht11pin: DigitalPin, dht11type: DHT11Type): number {

        pins.digitalWritePin(dht11pin, 0)
        basic.pause(18)
        let i = pins.digitalReadPin(dht11pin)
        pins.setPull(dht11pin, PinPullMode.PullUp);
        switch (dht11type) {
            case 0:
                let dhtvalue1 = 0;
                let dhtcounter1 = 0;
                while (pins.digitalReadPin(dht11pin) == 1);
                while (pins.digitalReadPin(dht11pin) == 0);
                while (pins.digitalReadPin(dht11pin) == 1);
                for (let i = 0; i <= 32 - 1; i++) {
                    while (pins.digitalReadPin(dht11pin) == 0);
                    dhtcounter1 = 0
                    while (pins.digitalReadPin(dht11pin) == 1) {
                        dhtcounter1 += 1;
                    }
                    if (i > 15) {
                        if (dhtcounter1 > 2) {
                            dhtvalue1 = dhtvalue1 + (1 << (31 - i));
                        }
                    }
                }
                return ((dhtvalue1 & 0x0000ff00) >> 8);
                break;
            case 1:
                while (pins.digitalReadPin(dht11pin) == 1);
                while (pins.digitalReadPin(dht11pin) == 0);
                while (pins.digitalReadPin(dht11pin) == 1);
                let dhtvalue = 0;
                let dhtcounter = 0;
                for (let i = 0; i <= 32 - 1; i++) {
                    while (pins.digitalReadPin(dht11pin) == 0);
                    dhtcounter = 0
                    while (pins.digitalReadPin(dht11pin) == 1) {
                        dhtcounter += 1;
                    }
                    if (i > 15) {
                        if (dhtcounter > 2) {
                            dhtvalue = dhtvalue + (1 << (31 - i));
                        }
                    }
                }
                return Math.round((((dhtvalue & 0x0000ff00) >> 8) * 9 / 5) + 32);
                break;
            case 2:
                while (pins.digitalReadPin(dht11pin) == 1);
                while (pins.digitalReadPin(dht11pin) == 0);
                while (pins.digitalReadPin(dht11pin) == 1);

                let value = 0;
                let counter = 0;

                for (let i = 0; i <= 8 - 1; i++) {
                    while (pins.digitalReadPin(dht11pin) == 0);
                    counter = 0
                    while (pins.digitalReadPin(dht11pin) == 1) {
                        counter += 1;
                    }
                    if (counter > 3) {
                        value = value + (1 << (7 - i));
                    }
                }
                return value;
            default:
                return 0;
        }
    }

    /**
    * get water level value (0~100)
    * @param waterlevelpin describe parameter here, eg: AnalogPin.P1
    */
    //% subcategory=Sensor  
    //% blockId="readWaterLevel" block="value of water level(0~100) at pin %waterlevelpin"
    export function ReadWaterLevel(waterlevelpin: AnalogPin): number {
        let voltage = 0;
        let waterlevel = 0;
        voltage = pins.map(
            pins.analogReadPin(waterlevelpin),
            0,
            700,
            0,
            100
        );
        waterlevel = voltage;
        return Math.round(waterlevel)
    }

    //% subcategory=Sensor  
    //% block="value of BME280 %state"
    export function octopus_BME280(state: BME280_state): number {
        switch (state) {
            case 0:
                get();
                return Math.round(T);
                break;
            case 1:
                get();
                return Math.round(H);
                break;
            case 2:
                get();
                return Math.round(P / 100);
                break;
            case 3:
                get();
                return Math.round(1015 - (P / 100)) * 9
                break;
            default:
                return 0
        }
        return 0;
    }

    /**
    * toggle Relay
    */
    //% blockId=Relay block="at pin %pin Relay toggle to %Relaystate"
    //% Relaystate.fieldEditor="gridpicker"
    //% Relaystate.fieldOptions.columns=2
    //% subcategory=Output
    export function Relay(pin: DigitalPin, Relaystate: RelayStateList): void {
        switch (Relaystate) {
            case RelayStateList.On:
                pins.digitalWritePin(pin, 1)
                break;
            case RelayStateList.Off:
                pins.digitalWritePin(pin, 0)
                break;
        }
    }

    /**
    * toggle fan
    */
    //% blockId=fan block="at pin %pin fan toggle to %Relaystate"
    //% state.fieldEditor="gridpicker"
    //% state.fieldOptions.columns=2
    //% subcategory=Output
    export function fan(pin: DigitalPin, state: GeneralStateList): void {
        switch (state) {
            case GeneralStateList.On:
                pins.digitalWritePin(pin, 1)
                break;
            case GeneralStateList.Off:
                pins.digitalWritePin(pin, 0)
                break;
        }
    }

    /**
     * TODO: Set the on-board LED display mode. 
     * @param mode breath or off , eg: LightMode.BREATH
     */
    //% blockId="setLightMode" block="Set light mode to %mode"
    //% subcategory=Output
    export function setLightMode(mode: LightMode): void {
        let buff = pins.createBuffer(4);
        switch (mode) {
            case LightMode.BREATH:
                buff[0] = 0x11;
                buff[1] = 0x00;
                buff[2] = 0;
                buff[3] = 0;
                pins.i2cWriteBuffer(board_address, buff);
                buff[0] = 0x12;
                buff[1] = 150;
                basic.pause(100);
                pins.i2cWriteBuffer(board_address, buff);
                break;
            case LightMode.OFF:
                buff[0] = 0x12;
                buff[1] = 0;
                buff[2] = 0;
                buff[3] = 0;
                pins.i2cWriteBuffer(board_address, buff);
                buff[0] = 0x11;
                buff[1] = 160;
                basic.pause(100);
                pins.i2cWriteBuffer(board_address, buff);
                break;
            default:
                break;
        }
    }
    
	/**
    * TODO: Set the brightness of on-board LED lamp.
    * @param light brightness, eg: 100
    */
    //% blockId=lightIntensity block="Set light intensity to %light"
    //% light.min=0 light.max=100
    //% subcategory=Output
    export function lightIntensity(light: number): void {
        let buff = pins.createBuffer(4);
        buff[0] = 0x12;
        buff[1] = light;
        buff[2] = 0;
        buff[3] = 0;
        pins.i2cWriteBuffer(board_address, buff);
        basic.pause(100);
        buff[0] = 0x11;
        buff[1] = 160;
        pins.i2cWriteBuffer(board_address, buff);
    }

}

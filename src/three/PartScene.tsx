import { BOARDS, ELECTRICAL, LAMP_COLORS, LED_COLORS, supplySettings } from '@/circuit/catalog'
import type { PartResult } from '@/circuit/solver'
import type { LampColor, LedColor, PartData } from '@/circuit/types'
import { Stage, type Framing } from './helpers'
import { BatteryModel } from './models/Battery'
import { BuzzerModel } from './models/Buzzer'
import { ButtonModel, DimmerModel, ResistorModel, SwitchModel } from './models/Controls'
import { ArduinoModel } from './models/Arduino'
import { BoardModel } from './models/Boards'
import { CapacitorModel } from './models/Capacitor'
import { DiodeModel } from './models/Diode'
import { FuseModel } from './models/Fuse'
import { LampModel } from './models/Lamp'
import { LdrModel } from './models/Ldr'
import { LedModel } from './models/Led'
import { MeterModel } from './models/Meter'
import { MotorModel } from './models/Motor'
import {
  GasSensorModel,
  PirModel,
  SoilSensorModel,
  SoundSensorModel,
  TempSensorModel,
  TouchSensorModel,
  UltrasonicModel,
} from './models/Sensors'
import { ServoModel } from './models/Servo'
import { SolarModel } from './models/Solar'
import { ReedModel, TiltModel } from './models/Switches'
import { ThermistorModel } from './models/Thermistor'
import { TransistorModel } from './models/Transistor'
import { LogicGateModel, RegulatorModel, Timer555Model } from './models/Chips'
import { ElectromagnetModel } from './models/Electromagnet'
import { PotentiometerModel } from './models/Potentiometer'
import { PowerSupplyModel } from './models/PowerSupply'
import { RelayModel } from './models/Relay'
import { RgbLedModel } from './models/RgbLed'
import { SpeakerModel } from './models/Speaker'
import { VibrationMotorModel } from './models/Vibration'
import { meterReading } from '@/circuit/devices'
import { BarGraphModel } from './models/BarGraph'
import { BellModel } from './models/Bell'
import { ComparatorModel, CounterModel, HBridgeModel, LatchModel } from './models/ChipModules'
import { FanModel } from './models/Fan'
import { IrLedModel } from './models/IrLed'
import { LaserModel } from './models/Laser'
import { LogicProbeModel } from './models/LogicProbe'
import { MosfetModel } from './models/Mosfet'
import { MultimeterModel } from './models/Multimeter'
import { OptocouplerModel } from './models/Optocoupler'
import { PumpModel } from './models/Pump'
import { SolenoidModel } from './models/Solenoid'
import { TrafficLightModel } from './models/TrafficLight'
import { BeaconModel } from './models/Beacon'
import { HeaterModel } from './models/Heater'
import { ZenerModel } from './models/Zener'
import { AiBoardModel } from './models/AiBoard'
import { CoinCellModel, DynamoModel, LemonModel, PowerBankModel } from './models/Cells'
import { ForceSensorModel, HallSensorModel, KnockSensorModel, PulseSensorModel } from './models/HandSensors'
import { FlameSensorModel, IrSensorModel, LineSensorModel } from './models/InfraredSensors'
import { JoystickModel, MicroSwitchModel, SlideSwitchModel } from './models/Inputs'
import { PressureSensorModel } from './models/Gauges'
import { RadioModel } from './models/Radios'
import { HumiditySensorModel, RainSensorModel, WaterSensorModel } from './models/WaterSensors'

/*
 * Camera framing for every model, measured so each one sits in the middle of
 * its card's 3D window with a clear margin on all four sides. Parts that can
 * be turned (battery, switch, resistor) get a second framing for when they
 * stand upright, because the window is wider than it is tall.
 */
const FRAMING = {
  battery: { camera: [0, 0.3, 4.4], scale: 0.93, lift: 0.05 },
  switch: { camera: [0, 0.4, 4.6], scale: 1.06, lift: 0.35 },
  switchUpright: { camera: [0, 0.4, 4.6], scale: 1.25, lift: 0 },
  button: { camera: [0, 0.55, 4.6], scale: 0.78, lift: -0.22 },
  dimmer: { camera: [0, 0.2, 4.6], scale: 1.09, lift: -0.19 },
  resistor: { camera: [0, 0.3, 4.4], scale: 0.8, lift: 0 },
  resistorUpright: { camera: [0, 0.3, 4.4], scale: 1.36, lift: 0 },
  lamp: { camera: [0, 0.35, 4.4], scale: 1.13, lift: -0.08 },
  led: { camera: [0, 0.35, 4.2], scale: 1.15, lift: -0.13 },
  motor: { camera: [0, 0.5, 4.8], scale: 1.08, lift: -0.34 },
  buzzer: { camera: [0, 0.55, 4.6], scale: 0.82, lift: -0.26 },
  solar: { camera: [0, 0.4, 4.6], scale: 0.93, lift: -0.04 },
  arduino: { camera: [0, 0.4, 4.6], scale: 1.24, lift: -0.1 },
  capacitor: { camera: [0, 0.4, 4.6], scale: 1.01, lift: -0.07 },
  diode: { camera: [0, 0.4, 4.6], scale: 0.76, lift: 0 },
  diodeUpright: { camera: [0, 0.4, 4.6], scale: 1.24, lift: 0 },
  transistor: { camera: [0, 0.4, 4.6], scale: 0.91, lift: -0.03 },
  fuse: { camera: [0, 0.4, 4.6], scale: 0.67, lift: 0 },
  fuseUpright: { camera: [0, 0.4, 4.6], scale: 1.08, lift: 0 },
  ldr: { camera: [0, 0.4, 4.6], scale: 0.82, lift: 0 },
  meter: { camera: [0, 0.4, 4.6], scale: 1.09, lift: -0.07 },
  servo: { camera: [0, 0.4, 4.6], scale: 0.8, lift: -0.09 },
  thermistor: { camera: [0, 0.4, 4.6], scale: 0.76, lift: 0 },
  tilt: { camera: [0, 0.4, 4.6], scale: 0.78, lift: 0 },
  reed: { camera: [0, 0.4, 4.6], scale: 0.72, lift: 0 },
  module: { camera: [0, 0.4, 4.6], scale: 0.95, lift: 0 },
  // the newer sensors, switches and small power sources
  flameSensor: { camera: [0, 0.4, 4.6], scale: 0.81, lift: 0 },
  rainSensor: { camera: [0, 0.4, 4.6], scale: 0.71, lift: 0 },
  waterSensor: { camera: [0, 0.4, 4.6], scale: 0.85, lift: 0.04 },
  humiditySensor: { camera: [0, 0.4, 4.6], scale: 0.67, lift: -0.13 },
  hallSensor: { camera: [0, 0.4, 4.6], scale: 0.77, lift: -0.03 },
  irSensor: { camera: [0, 0.4, 4.6], scale: 0.73, lift: -0.02 },
  lineSensor: { camera: [0, 0.4, 4.6], scale: 0.85, lift: -0.04 },
  forceSensor: { camera: [0, 0.4, 4.6], scale: 0.79, lift: 0.2 },
  pulseSensor: { camera: [0, 0.4, 4.6], scale: 0.84, lift: -0.09 },
  knockSensor: { camera: [0, 0.4, 4.6], scale: 0.75, lift: 0.05 },
  slideSwitch: { camera: [0, 0.4, 4.6], scale: 0.65, lift: 0.08 },
  slideSwitchUpright: { camera: [0, 0.4, 4.6], scale: 1.1, lift: 0 },
  microSwitch: { camera: [0, 0.4, 4.6], scale: 0.72, lift: -0.06 },
  joystick: { camera: [0, 0.4, 4.6], scale: 0.68, lift: 0.02 },
  lemon: { camera: [0, 0.4, 4.6], scale: 0.8, lift: 0.05 },
  coinCell: { camera: [0, 0.4, 4.6], scale: 0.68, lift: -0.14 },
  dynamo: { camera: [0, 0.4, 4.6], scale: 0.66, lift: -0.13 },
  powerBank: { camera: [0, 0.4, 4.6], scale: 0.75, lift: -0.19 },
  powerSupply: { camera: [0, 0.4, 4.6], scale: 1.08, lift: -0.15 },
  potentiometer: { camera: [0, 0.4, 4.6], scale: 1.1, lift: -0.1 },
  relay: { camera: [0, 0.4, 4.6], scale: 1.1, lift: -0.15 },
  rgbLed: { camera: [0, 0.35, 4.2], scale: 1.2, lift: -0.13 },
  speaker: { camera: [0, 0.4, 4.6], scale: 1.02, lift: 0.05 },
  vibration: { camera: [0, 0.4, 4.6], scale: 0.8, lift: -0.13 },
  electromagnet: { camera: [0, 0.4, 4.6], scale: 0.85, lift: 0 },
  regulator: { camera: [0, 0.4, 4.6], scale: 1.05, lift: -0.12 },
  gate: { camera: [0, 0.4, 4.6], scale: 0.9, lift: 0 },
  timer555: { camera: [0, 0.4, 4.6], scale: 0.9, lift: 0 },
  // the newer components, outputs, chips and meters
  zener: { camera: [0, 0.4, 4.6], scale: 0.68, lift: 0 },
  zenerUpright: { camera: [0, 0.4, 4.6], scale: 1, lift: 0.07 },
  mosfet: { camera: [0, 0.4, 4.6], scale: 0.84, lift: 0.1 },
  optocoupler: { camera: [0, 0.4, 4.6], scale: 0.6, lift: 0.09 },
  laser: { camera: [0, 0.4, 4.6], scale: 1, lift: 0 },
  irLed: { camera: [0, 0.35, 4.2], scale: 1.15, lift: -0.13 },
  solenoid: { camera: [0, 0.4, 4.6], scale: 0.88, lift: 0 },
  pump: { camera: [0, 0.4, 4.6], scale: 0.95, lift: 0 },
  bell: { camera: [0, 0.4, 4.6], scale: 1, lift: 0 },
  barGraph: { camera: [0, 0.4, 4.6], scale: 0.9, lift: 0 },
  trafficLight: { camera: [0, 0.4, 4.6], scale: 1.04, lift: 0 },
  beacon: { camera: [0, 1.0, 4.4], scale: 0.9, lift: -0.12 },
  fan: { camera: [0, 0.4, 4.6], scale: 1, lift: 0 },
  heater: { camera: [0, 0.4, 4.6], scale: 1, lift: -0.05 },
  latch: { camera: [0, 0.4, 4.6], scale: 0.9, lift: 0 },
  counter: { camera: [0, 0.4, 4.6], scale: 0.9, lift: 0 },
  comparator: { camera: [0, 0.4, 4.6], scale: 0.9, lift: 0 },
  hBridge: { camera: [0, 0.4, 4.6], scale: 0.85, lift: 0 },
  multimeter: { camera: [0, 0.4, 4.6], scale: 1.15, lift: -0.04 },
  logicProbe: { camera: [0, 0.4, 4.6], scale: 1.03, lift: -0.17 },
  aiBoard: { camera: [0, 0.4, 4.6], scale: 1.06, lift: -0.1 },
  // the message modules and the pressure gauge
  gsm: { camera: [0, 0.4, 4.6], scale: 0.85, lift: 0 },
  wifi: { camera: [0, 0.4, 4.6], scale: 0.74, lift: 0 },
  bluetooth: { camera: [0, 0.4, 4.6], scale: 0.76, lift: 0 },
  lora: { camera: [0, 0.4, 4.6], scale: 0.95, lift: 0 },
  gps: { camera: [0, 0.4, 4.6], scale: 0.75, lift: 0 },
  canBus: { camera: [0, 0.4, 4.6], scale: 0.76, lift: 0 },
  rs485: { camera: [0, 0.4, 4.6], scale: 0.72, lift: 0 },
  pressureSensor: { camera: [0, 0.4, 4.6], scale: 0.8, lift: 0 },
} satisfies Record<string, Framing>

/** The animated 3D preview of one part, driven by its simulation result. */
export function PartScene({
  data,
  result,
  thinking = false,
}: {
  data: PartData
  result?: PartResult
  /** the AI board is waiting for its model's answer */
  thinking?: boolean
}) {
  const level = result?.level ?? 0
  const status = result?.status ?? 'idle'
  const upright = data.rotation === 90 || data.rotation === 270

  switch (data.type) {
    case 'lamp':
      return (
        <Stage {...FRAMING.lamp}>
          <LampModel
            level={level}
            burnt={!!data.burnt}
            color={LAMP_COLORS[(data.color as LampColor) ?? 'warm'] ?? LAMP_COLORS.warm}
          />
        </Stage>
      )
    case 'led':
      return (
        <Stage {...FRAMING.led}>
          <LedModel
            level={level}
            burnt={!!data.burnt}
            color={LED_COLORS[(data.color as LedColor) ?? 'red'] ?? LED_COLORS.red}
          />
        </Stage>
      )
    case 'motor':
      return (
        <Stage {...FRAMING.motor}>
          <MotorModel speed={level} overheated={status === 'over'} />
        </Stage>
      )
    case 'buzzer':
      return (
        <Stage {...FRAMING.buzzer}>
          <BuzzerModel level={level} />
        </Stage>
      )
    case 'battery':
      return (
        <Stage {...FRAMING.battery}>
          <BatteryModel
            voltage={data.voltage ?? 3}
            rotation={data.rotation}
            delivering={status === 'on'}
            short={status === 'short'}
          />
        </Stage>
      )
    case 'switch':
      return (
        <Stage {...(upright ? FRAMING.switchUpright : FRAMING.switch)}>
          <SwitchModel closed={!!data.closed} rotation={data.rotation} current={result?.current ?? 0} />
        </Stage>
      )
    case 'button':
      return (
        <Stage {...FRAMING.button}>
          <ButtonModel pressed={!!data.pressed} />
        </Stage>
      )
    case 'resistor':
      return (
        <Stage {...(upright ? FRAMING.resistorUpright : FRAMING.resistor)}>
          <ResistorModel
            ohms={data.resistance ?? 100}
            rotation={data.rotation}
            heat={(result?.power ?? 0) / ELECTRICAL.resistor.ratedPower}
          />
        </Stage>
      )
    case 'dimmer':
      return (
        <Stage {...FRAMING.dimmer}>
          <DimmerModel level={data.level ?? 0.7} />
        </Stage>
      )
    case 'solar':
      return (
        <Stage {...FRAMING.solar}>
          <SolarModel
            light={data.light ?? 0.8}
            output={Math.min(1, Math.max(0, (result?.current ?? 0) / (ELECTRICAL.solar.voltage / ELECTRICAL.solar.resistance)))}
          />
        </Stage>
      )
    case 'arduino':
      return (
        <Stage {...FRAMING.arduino}>
          <ArduinoModel pins={result?.pins ?? {}} powered={result !== undefined} />
        </Stage>
      )
    case 'nano':
    case 'mega':
    case 'esp32':
    case 'esp8266':
    case 'pico':
    case 'microbit':
    case 'raspberrypi':
    case 'ecu':
    case 'plc':
    case 'rtu':
    case 'atmega328':
    case 'atmega32':
    case 'attiny85':
    case 'stm32':
      return (
        <Stage {...FRAMING.arduino}>
          <BoardModel
            variant={data.type}
            levels={BOARDS[data.type].pins.map((pin) => result?.pins?.[pin] ?? 0)}
            powered={result !== undefined}
          />
        </Stage>
      )
    case 'aiBoard':
      return (
        <Stage {...FRAMING.aiBoard}>
          <AiBoardModel
            levels={BOARDS.aiBoard.pins.map((pin) => result?.pins?.[pin] ?? 0)}
            powered={result !== undefined}
            thinking={thinking}
          />
        </Stage>
      )
    case 'capacitor':
      return (
        <Stage {...FRAMING.capacitor}>
          <CapacitorModel
            charge={Math.min(1, Math.abs(level) / 9)}
            capacitance={data.capacitance ?? 2200}
            reversed={status === 'reverse'}
          />
        </Stage>
      )
    case 'diode':
      return (
        <Stage {...(upright ? FRAMING.diodeUpright : FRAMING.diode)}>
          <DiodeModel current={result?.current ?? 0} burnt={!!data.burnt} rotation={data.rotation} />
        </Stage>
      )
    case 'transistor':
      return (
        <Stage {...FRAMING.transistor}>
          <TransistorModel on={Math.min(1, (result?.current ?? 0) / 0.1)} burnt={!!data.burnt} />
        </Stage>
      )
    case 'fuse':
      return (
        <Stage {...(upright ? FRAMING.fuseUpright : FRAMING.fuse)}>
          <FuseModel blown={!!data.burnt} load={level} rotation={data.rotation} />
        </Stage>
      )
    case 'ldr':
      return (
        <Stage {...FRAMING.ldr}>
          <LdrModel light={data.light ?? 0.6} />
        </Stage>
      )
    case 'voltmeter':
    case 'ammeter':
      return (
        <Stage {...FRAMING.meter}>
          <MeterModel
            kind={data.type === 'voltmeter' ? 'volt' : 'amp'}
            value={level}
            fullScale={data.type === 'voltmeter' ? 10 : 0.5}
          />
        </Stage>
      )
    case 'servo':
      return (
        <Stage {...FRAMING.servo}>
          <ServoModel angle={level} powered={status === 'on'} />
        </Stage>
      )
    case 'thermistor':
      return (
        <Stage {...FRAMING.thermistor}>
          <ThermistorModel heat={data.sense ?? 0.42} />
        </Stage>
      )
    case 'tilt':
      return (
        <Stage {...FRAMING.tilt}>
          <TiltModel tilted={(data.sense ?? 0) > 0.5} />
        </Stage>
      )
    case 'reed':
      return (
        <Stage {...FRAMING.reed}>
          <ReedModel closed={(data.sense ?? 0) > 0.5} />
        </Stage>
      )
    case 'powerSupply': {
      const { voltage, limit } = supplySettings(data)
      return (
        <Stage {...FRAMING.powerSupply}>
          <PowerSupplyModel
            on={result !== undefined}
            volts={Math.max(0, result?.voltage ?? 0)}
            amps={result?.current ?? 0}
            setting={voltage / ELECTRICAL.supply.maxVoltage}
            // the current knob runs from 0.1 A to 2 A
            limit={Math.log(limit / 0.1) / Math.log(20)}
            limiting={status === 'over'}
          />
        </Stage>
      )
    }
    case 'potentiometer':
      return (
        <Stage {...FRAMING.potentiometer}>
          <PotentiometerModel level={data.level ?? 0.5} powered={Math.abs(result?.voltage ?? 0) > 0.05} />
        </Stage>
      )
    case 'relay':
      return (
        <Stage {...FRAMING.relay}>
          <RelayModel
            closed={level > 0.5}
            coil={Math.abs(result?.voltage ?? 0) / ELECTRICAL.relay.pullIn}
            contact={result?.channels?.contact ?? 0}
          />
        </Stage>
      )
    case 'rgbLed':
      return (
        <Stage {...FRAMING.rgbLed}>
          <RgbLedModel
            r={result?.channels?.R ?? 0}
            g={result?.channels?.G ?? 0}
            b={result?.channels?.B ?? 0}
            burnt={!!data.burnt}
          />
        </Stage>
      )
    case 'speaker':
      return (
        <Stage {...FRAMING.speaker}>
          <SpeakerModel level={level} pitch={data.pitch ?? 523} burnt={!!data.burnt} />
        </Stage>
      )
    case 'vibration':
      return (
        <Stage {...FRAMING.vibration}>
          <VibrationMotorModel speed={level} hot={status === 'over'} />
        </Stage>
      )
    case 'electromagnet':
      return (
        <Stage {...FRAMING.electromagnet}>
          <ElectromagnetModel strength={level} hot={status === 'over'} />
        </Stage>
      )
    case 'regulator':
      return (
        <Stage {...FRAMING.regulator}>
          <RegulatorModel
            heat={(result?.power ?? 0) / ELECTRICAL.regulator.ratedPower}
            regulating={status === 'on' || status === 'over'}
          />
        </Stage>
      )
    case 'notGate':
    case 'andGate':
    case 'orGate':
    case 'xorGate':
    case 'nandGate':
    case 'norGate':
      return (
        <Stage {...FRAMING.gate}>
          <LogicGateModel
            kind={data.type}
            inputs={[result?.channels?.A ?? 0, result?.channels?.B ?? 0]}
            output={result?.channels?.Y ?? 0}
            powered={status !== 'reverse' && (result?.voltage ?? 0) >= ELECTRICAL.logic.minVoltage}
          />
        </Stage>
      )
    case 'timer555':
      return (
        <Stage {...FRAMING.timer555}>
          <Timer555Model output={level} powered={status === 'on'} />
        </Stage>
      )
    case 'zener':
      return (
        <Stage {...(upright ? FRAMING.zenerUpright : FRAMING.zener)}>
          <ZenerModel
            holding={result?.channels?.holding ?? 0}
            forward={result?.channels?.forward ?? 0}
            burnt={!!data.burnt}
            rotation={data.rotation}
          />
        </Stage>
      )
    case 'pnp':
      return (
        <Stage {...FRAMING.transistor}>
          <TransistorModel variant="pnp" on={Math.min(1, (result?.current ?? 0) / 0.1)} burnt={!!data.burnt} />
        </Stage>
      )
    case 'mosfet':
      return (
        <Stage {...FRAMING.mosfet}>
          <MosfetModel drive={level} current={Math.abs(result?.current ?? 0)} hot={status === 'over'} />
        </Stage>
      )
    case 'optocoupler':
      return (
        <Stage {...FRAMING.optocoupler}>
          <OptocouplerModel
            led={level}
            output={Math.min(1, Math.abs(result?.channels?.switch ?? 0) / 0.02)}
            burnt={!!data.burnt}
          />
        </Stage>
      )
    case 'laser':
      return (
        <Stage {...FRAMING.laser}>
          <LaserModel level={level} burnt={!!data.burnt} />
        </Stage>
      )
    case 'irLed':
      return (
        <Stage {...FRAMING.irLed}>
          <IrLedModel level={level} burnt={!!data.burnt} camera={!!data.camera} />
        </Stage>
      )
    case 'solenoid':
      return (
        <Stage {...FRAMING.solenoid}>
          <SolenoidModel push={level} hot={status === 'over'} />
        </Stage>
      )
    case 'pump':
      return (
        <Stage {...FRAMING.pump}>
          <PumpModel flow={level} />
        </Stage>
      )
    case 'bell':
      return (
        <Stage {...FRAMING.bell}>
          <BellModel ring={level} hot={status === 'over'} />
        </Stage>
      )
    case 'barGraph':
      return (
        <Stage {...FRAMING.barGraph}>
          <BarGraphModel bars={level} powered={status === 'on'} />
        </Stage>
      )
    case 'trafficLight':
      return (
        <Stage {...FRAMING.trafficLight}>
          <TrafficLightModel r={result?.channels?.R ?? 0} y={result?.channels?.Y ?? 0} g={result?.channels?.G ?? 0} />
        </Stage>
      )
    case 'beacon':
      return (
        <Stage {...FRAMING.beacon}>
          <BeaconModel
            color={LED_COLORS[(data.color as LedColor) ?? 'orange'] ?? LED_COLORS.orange}
            level={level}
            burnt={!!data.burnt}
          />
        </Stage>
      )
    case 'fan':
      return (
        <Stage {...FRAMING.fan}>
          <FanModel speed={level} hot={status === 'over'} />
        </Stage>
      )
    case 'heater':
      return (
        <Stage {...FRAMING.heater}>
          <HeaterModel level={level} over={status === 'over'} />
        </Stage>
      )
    case 'latch':
      return (
        <Stage {...FRAMING.latch}>
          <LatchModel
            set={result?.channels?.S ?? 0}
            reset={result?.channels?.R ?? 0}
            q={result?.channels?.Q ?? 0}
            powered={(status === 'on' || status === 'idle') && (result?.voltage ?? 0) >= ELECTRICAL.logic.minVoltage}
          />
        </Stage>
      )
    case 'counter':
      return (
        <Stage {...FRAMING.counter}>
          <CounterModel count={level} clock={result?.channels?.CLK ?? 0} powered={status === 'on'} />
        </Stage>
      )
    case 'comparator':
      return (
        <Stage {...FRAMING.comparator}>
          <ComparatorModel
            out={result?.channels?.OUT ?? 0}
            powered={(status === 'on' || status === 'idle') && (result?.voltage ?? 0) >= ELECTRICAL.logic.minVoltage}
          />
        </Stage>
      )
    case 'hBridge':
      return (
        <Stage {...FRAMING.hBridge}>
          <HBridgeModel
            direction={level}
            in1={result?.channels?.IN1 ?? 0}
            in2={result?.channels?.IN2 ?? 0}
            powered={(result?.voltage ?? 0) >= ELECTRICAL.hBridge.minVoltage}
            hot={status === 'over'}
          />
        </Stage>
      )
    case 'multimeter': {
      const dial = data.dial ?? 'volts'
      const { text, unit } = meterReading(dial, result)
      return (
        <Stage {...FRAMING.multimeter}>
          <MultimeterModel dial={dial} text={text} unit={unit} beep={result?.channels?.beep === 1} />
        </Stage>
      )
    }
    case 'slideSwitch':
      return (
        <Stage {...(upright ? FRAMING.slideSwitchUpright : FRAMING.slideSwitch)}>
          <SlideSwitchModel toB={!!data.closed} rotation={data.rotation} current={result?.current ?? 0} />
        </Stage>
      )
    case 'microSwitch':
      return (
        <Stage {...FRAMING.microSwitch}>
          <MicroSwitchModel pressed={!!data.pressed} />
        </Stage>
      )
    case 'joystick':
      return (
        <Stage {...FRAMING.joystick}>
          <JoystickModel x={data.stickX ?? 0.5} y={data.stickY ?? 0.5} powered={status === 'on'} />
        </Stage>
      )
    case 'lemon':
      return (
        <Stage {...FRAMING.lemon}>
          <LemonModel cells={data.cells ?? 3} />
        </Stage>
      )
    case 'coinCell':
      return (
        <Stage {...FRAMING.coinCell}>
          {/* 1 when the load takes as much as a short circuit would */}
          <CoinCellModel load={(result?.current ?? 0) / (ELECTRICAL.coinCell.voltage / ELECTRICAL.coinCell.resistance)} />
        </Stage>
      )
    case 'dynamo':
      return (
        <Stage {...FRAMING.dynamo}>
          <DynamoModel speed={data.level ?? 0} output={(result?.current ?? 0) / 0.3} />
        </Stage>
      )
    case 'powerBank':
      return (
        <Stage {...FRAMING.powerBank}>
          <PowerBankModel on={status === 'on' || status === 'over'} limiting={status === 'over'} />
        </Stage>
      )
    case 'gsm':
    case 'wifi':
    case 'bluetooth':
    case 'lora':
    case 'gps':
    case 'canBus':
    case 'rs485':
      return (
        <Stage {...FRAMING[data.type]}>
          <RadioModel
            variant={data.type}
            powered={status === 'on'}
            linked={(result?.channels?.link ?? 0) > 0.5}
            tx={(result?.channels?.tx ?? 0) > 0.5}
          />
        </Stage>
      )
    case 'logicProbe':
      return (
        <Stage {...FRAMING.logicProbe}>
          <LogicProbeModel
            high={result?.channels?.high ?? 0}
            low={result?.channels?.low ?? 0}
            pulse={result?.channels?.pulse ?? 0}
            powered={status === 'on'}
          />
        </Stage>
      )
    default: {
      // the 3-pin sensor modules share their props
      const props = { sense: data.sense ?? 0, level, powered: status === 'on' }
      const Model = {
        tempSensor: TempSensorModel,
        ultrasonic: UltrasonicModel,
        pir: PirModel,
        soundSensor: SoundSensorModel,
        gasSensor: GasSensorModel,
        soilSensor: SoilSensorModel,
        touchSensor: TouchSensorModel,
        flameSensor: FlameSensorModel,
        rainSensor: RainSensorModel,
        waterSensor: WaterSensorModel,
        humiditySensor: HumiditySensorModel,
        hallSensor: HallSensorModel,
        irSensor: IrSensorModel,
        lineSensor: LineSensorModel,
        forceSensor: ForceSensorModel,
        pulseSensor: PulseSensorModel,
        knockSensor: KnockSensorModel,
        pressureSensor: PressureSensorModel,
      }[data.type as string]
      if (!Model) return null
      // the newer modules each have a framing of their own
      const framing: Framing = (FRAMING as Record<string, Framing>)[data.type] ?? FRAMING.module
      return (
        <Stage {...framing}>
          <Model {...props} />
        </Stage>
      )
    }
  }
}

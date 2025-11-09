import { Cbor, MajorType } from "./cbor";
import { bytesToHex } from "./data-utils";
import { isFloat } from "./simple";

export function cborDebug(cbor: Cbor): string {
  switch (cbor.type) {
    case MajorType.Unsigned:
      return `unsigned(${cbor.value})`;
    case MajorType.Negative:
      // Convert stored magnitude to actual negative value for display
      const actualNegative = typeof cbor.value === 'bigint' ? -cbor.value - 1n : -cbor.value - 1;
      return `negative(${actualNegative})`;
    case MajorType.ByteString:
      return `bytes(${bytesToHex(cbor.value)})`;
    case MajorType.Text:
      return `text("${cbor.value}")`;
    case MajorType.Array:
      return `array([${cbor.value.map(cborDebug).join(', ')}])`;
    case MajorType.Map:
      return cbor.value.debug;
    case MajorType.Tagged:
      return `tagged(${cbor.tag}, ${cborDebug(cbor.value)})`;
    case MajorType.Simple:
      const value = cbor.value;
      if (value.type === 'True') {
        return `simple(true)`;
      } else if (value.type === 'False') {
        return `simple(false)`;
      } else if (value.type === 'Null') {
        return `simple(null)`;
      } else if (value.type === 'Float') {
        return `simple(${value.value})`;
      }
      return `simple(unknown)`;
  }
}

export function cborDiagnostic(cbor: Cbor): string {
  switch (cbor.type) {
    case MajorType.Unsigned:
      return `${cbor.value}`;
    case MajorType.Negative:
      // Convert stored magnitude to actual negative value for display
      const actualValue = typeof cbor.value === 'bigint' ? -cbor.value - 1n : -cbor.value - 1;
      return `${actualValue}`;
    case MajorType.ByteString:
      return `h'${bytesToHex(cbor.value)}'`;
    case MajorType.Text:
      return `"${cbor.value}"`;
    case MajorType.Array:
      return `[${cbor.value.map(cborDiagnostic).join(', ')}]`;
    case MajorType.Map:
      return cbor.value.diagnostic;
    case MajorType.Tagged:
      return `${cbor.tag}(${cborDiagnostic(cbor.value)})`;
    case MajorType.Simple:
      const value2 = cbor.value;
      if (value2.type === 'True') {
        return `true`;
      } else if (value2.type === 'False') {
        return `false`;
      } else if (value2.type === 'Null') {
        return `null`;
      } else if (value2.type === 'Float') {
        return `${value2.value}`;
      }
      return `simple(unknown)`;
  }
}

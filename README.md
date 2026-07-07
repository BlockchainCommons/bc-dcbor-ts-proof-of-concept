# Proof of Concept: Blockchain Commons Deterministic CBOR ("dCBOR") for TypeScript

<!--Guidelines: https://github.com/BlockchainCommons/secure-template/wiki -->

### _by Wolf McNally_

---

This was our original proof-of-concept for dCBOR in Typescript, intended to demonstrate that dCBOR was possible in languages other than Rust.

It has been superseded by a more mature implementation at [https://github.com/BlockchainCommons/bc-dcbor-ts](https://github.com/BlockchainCommons/bc-dcbor-ts).

---

`dcbor` is a [CBOR](https://cbor.io) codec that focuses on writing and parsing "deterministic" CBOR per [§4.2 of RFC-8949](https://www.rfc-editor.org/rfc/rfc8949.html#name-deterministically-encoded-c). It does not support parts of the spec forbidden by deterministic CBOR (such as indefinite length arrays and maps). It is strict in both what it writes and reads: in particular it will return decoding errors if variable-length integers are not encoded in their minimal form, or CBOR map keys are not in lexicographic order, or there is extra data past the end of the decoded CBOR item.

## Specification

The current specification of the norms and practices guiding the creation of this implementation are currently found in this IETF Internet Draft: [draft-mcnally-deterministic-cbor](https://datatracker.ietf.org/doc/draft-mcnally-deterministic-cbor/).

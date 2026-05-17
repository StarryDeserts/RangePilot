module rangepilot::errors;

const EInactiveStrategy: u64 = 0;
const EZeroQuantity: u64 = 1;
const EFeeBpsTooHigh: u64 = 2;
const EInsufficientFee: u64 = 3;
const EUnauthorized: u64 = 4;

public fun inactive_strategy(): u64 {
    EInactiveStrategy
}

public fun zero_quantity(): u64 {
    EZeroQuantity
}

public fun fee_bps_too_high(): u64 {
    EFeeBpsTooHigh
}

public fun insufficient_fee(): u64 {
    EInsufficientFee
}

public fun unauthorized(): u64 {
    EUnauthorized
}

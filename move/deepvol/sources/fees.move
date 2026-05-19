module deepvol::fees;

use deepvol::errors;

const BPS_DENOMINATOR: u64 = 10_000;
const DEFAULT_CREATE_FEE_BPS: u64 = 30;
const MAX_CREATE_FEE_BPS: u64 = 100;

public fun assert_valid_create_fee_bps(create_fee_bps: u64) {
    assert!(create_fee_bps <= MAX_CREATE_FEE_BPS, errors::fee_bps_too_high());
}

public fun calculate_create_fee(premium_paid: u64, create_fee_bps: u64): u64 {
    assert!(premium_paid > 0, errors::zero_premium());
    assert_valid_create_fee_bps(create_fee_bps);

    premium_paid * create_fee_bps / BPS_DENOMINATOR
}

public fun default_create_fee_bps(): u64 {
    DEFAULT_CREATE_FEE_BPS
}

public fun max_create_fee_bps(): u64 {
    MAX_CREATE_FEE_BPS
}

public fun bps_denominator(): u64 {
    BPS_DENOMINATOR
}

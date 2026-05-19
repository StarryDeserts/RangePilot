module deepvol::errors;

const EInactiveSeries: u64 = 0;
const EZeroQuantity: u64 = 1;
const EFeeBpsTooHigh: u64 = 2;
const EUnauthorized: u64 = 3;
const EEmptyMetadataUri: u64 = 4;
const EInvalidStrikeRange: u64 = 5;
const EExpiredSeries: u64 = 6;
const EZeroPremium: u64 = 7;
const EInvalidReceiptStatus: u64 = 8;
const EManagerOwnerMismatch: u64 = 9;
const EOracleMismatch: u64 = 10;
const EPremiumAboveMax: u64 = 11;
const EInsufficientCreateFeeCoin: u64 = 12;
const EInsufficientProtocolVaultBalance: u64 = 13;

public fun inactive_series(): u64 {
    EInactiveSeries
}

public fun zero_quantity(): u64 {
    EZeroQuantity
}

public fun fee_bps_too_high(): u64 {
    EFeeBpsTooHigh
}

public fun unauthorized(): u64 {
    EUnauthorized
}

public fun empty_metadata_uri(): u64 {
    EEmptyMetadataUri
}

public fun invalid_strike_range(): u64 {
    EInvalidStrikeRange
}

public fun expired_series(): u64 {
    EExpiredSeries
}

public fun zero_premium(): u64 {
    EZeroPremium
}

public fun invalid_receipt_status(): u64 {
    EInvalidReceiptStatus
}

public fun manager_owner_mismatch(): u64 {
    EManagerOwnerMismatch
}

public fun oracle_mismatch(): u64 {
    EOracleMismatch
}

public fun premium_above_max(): u64 {
    EPremiumAboveMax
}

public fun insufficient_create_fee_coin(): u64 {
    EInsufficientCreateFeeCoin
}

public fun insufficient_protocol_vault_balance(): u64 {
    EInsufficientProtocolVaultBalance
}

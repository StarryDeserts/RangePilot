#[test_only]
module deepvol::deepvol_tests;

use deepvol::{fees, receipt, series};
use std::unit_test::assert_eq;

const CREATOR: address = @0xA;
const OWNER: address = @0xB;
const UNAUTHORIZED: address = @0xC;
const ORACLE: address = @0xD;
const MANAGER: address = @0xE;
const EXPIRY: u64 = 1_779_436_800_000;
const LOWER_STRIKE: u64 = 76_705_000_000_000;
const UPPER_STRIKE: u64 = 76_803_000_000_000;
const QUANTITY: u64 = 1_000;
const PREMIUM_PAID: u64 = 1_003;
const CREATED_AT_MS: u64 = 1_000;
const SETTLED_AT_MS: u64 = 2_000;

#[test]
fun calculate_create_fee_uses_30_bps_default() {
    assert_eq!(fees::calculate_create_fee(1_000_000, fees::default_create_fee_bps()), 3_000);
}

#[test]
fun create_fee_bps_accepts_max_100() {
    fees::assert_valid_create_fee_bps(100);

    assert_eq!(fees::max_create_fee_bps(), 100);
}

#[test, expected_failure(abort_code = 2, location = deepvol::fees)]
fun create_fee_bps_rejects_101() {
    fees::assert_valid_create_fee_bps(101);
    abort 999
}

#[test]
fun new_series_stores_expected_fields() {
    let mut ctx = tx_context::dummy();
    let series = series::new_series_for_testing(
        CREATOR,
        object::id_from_address(ORACLE),
        EXPIRY,
        LOWER_STRIKE,
        UPPER_STRIKE,
        fees::default_create_fee_bps(),
        b"ipfs://deepvol-series",
        CREATED_AT_MS,
        &mut ctx,
    );

    assert_eq!(series::creator(&series), CREATOR);
    assert_eq!(series::oracle_id(&series), object::id_from_address(ORACLE));
    assert_eq!(series::expiry(&series), EXPIRY);
    assert_eq!(series::lower_strike(&series), LOWER_STRIKE);
    assert_eq!(series::upper_strike(&series), UPPER_STRIKE);
    assert_eq!(series::create_fee_bps(&series), fees::default_create_fee_bps());
    assert!(series::is_active(&series));
    assert_eq!(series::created_at_ms_for_testing(&series), CREATED_AT_MS);

    series::destroy_for_testing(series);
}

#[test, expected_failure(abort_code = 4, location = deepvol::series)]
fun new_series_rejects_empty_metadata_uri() {
    let mut ctx = tx_context::dummy();
    let series = series::new_series_for_testing(
        CREATOR,
        object::id_from_address(ORACLE),
        EXPIRY,
        LOWER_STRIKE,
        UPPER_STRIKE,
        fees::default_create_fee_bps(),
        vector[],
        CREATED_AT_MS,
        &mut ctx,
    );
    series::destroy_for_testing(series);
    abort 999
}

#[test, expected_failure(abort_code = 5, location = deepvol::series)]
fun new_series_rejects_invalid_strike_range() {
    let mut ctx = tx_context::dummy();
    let series = series::new_series_for_testing(
        CREATOR,
        object::id_from_address(ORACLE),
        EXPIRY,
        LOWER_STRIKE,
        LOWER_STRIKE,
        fees::default_create_fee_bps(),
        b"ipfs://deepvol-series",
        CREATED_AT_MS,
        &mut ctx,
    );
    series::destroy_for_testing(series);
    abort 999
}

#[test, expected_failure(abort_code = 6, location = deepvol::series)]
fun new_series_rejects_expired_series() {
    let mut ctx = tx_context::dummy();
    let series = series::new_series_for_testing(
        CREATOR,
        object::id_from_address(ORACLE),
        CREATED_AT_MS,
        LOWER_STRIKE,
        UPPER_STRIKE,
        fees::default_create_fee_bps(),
        b"ipfs://deepvol-series",
        CREATED_AT_MS,
        &mut ctx,
    );
    series::destroy_for_testing(series);
    abort 999
}

#[test, expected_failure(abort_code = 3, location = deepvol::series)]
fun deactivate_series_requires_creator() {
    let mut ctx = tx_context::dummy();
    let mut series = series::new_series_for_testing(
        CREATOR,
        object::id_from_address(ORACLE),
        EXPIRY,
        LOWER_STRIKE,
        UPPER_STRIKE,
        fees::default_create_fee_bps(),
        b"ipfs://deepvol-series",
        CREATED_AT_MS,
        &mut ctx,
    );

    series::deactivate_for_testing(&mut series, UNAUTHORIZED, SETTLED_AT_MS);

    series::destroy_for_testing(series);
    abort 999
}

#[test]
fun deactivate_series_marks_inactive() {
    let mut ctx = tx_context::dummy();
    let mut series = series::new_series_for_testing(
        CREATOR,
        object::id_from_address(ORACLE),
        EXPIRY,
        LOWER_STRIKE,
        UPPER_STRIKE,
        fees::default_create_fee_bps(),
        b"ipfs://deepvol-series",
        CREATED_AT_MS,
        &mut ctx,
    );

    series::deactivate_for_testing(&mut series, CREATOR, SETTLED_AT_MS);

    assert!(!series::is_active(&series));

    series::destroy_for_testing(series);
}

#[test, expected_failure(abort_code = 0, location = deepvol::receipt)]
fun receipt_rejects_inactive_series() {
    let mut ctx = tx_context::dummy();
    let mut series = series::new_series_for_testing(
        CREATOR,
        object::id_from_address(ORACLE),
        EXPIRY,
        LOWER_STRIKE,
        UPPER_STRIKE,
        fees::default_create_fee_bps(),
        b"ipfs://deepvol-series",
        CREATED_AT_MS,
        &mut ctx,
    );
    series::deactivate_for_testing(&mut series, CREATOR, SETTLED_AT_MS);

    let receipt = receipt::new_receipt_for_testing(
        OWNER,
        &series,
        object::id_from_address(MANAGER),
        QUANTITY,
        PREMIUM_PAID,
        CREATED_AT_MS,
        &mut ctx,
    );
    receipt::destroy_for_testing(receipt);
    series::destroy_for_testing(series);
    abort 999
}

#[test, expected_failure(abort_code = 1, location = deepvol::receipt)]
fun receipt_rejects_zero_quantity() {
    let mut ctx = tx_context::dummy();
    let series = series::new_series_for_testing(
        CREATOR,
        object::id_from_address(ORACLE),
        EXPIRY,
        LOWER_STRIKE,
        UPPER_STRIKE,
        fees::default_create_fee_bps(),
        b"ipfs://deepvol-series",
        CREATED_AT_MS,
        &mut ctx,
    );

    let receipt = receipt::new_receipt_for_testing(
        OWNER,
        &series,
        object::id_from_address(MANAGER),
        0,
        PREMIUM_PAID,
        CREATED_AT_MS,
        &mut ctx,
    );
    receipt::destroy_for_testing(receipt);
    series::destroy_for_testing(series);
    abort 999
}

#[test, expected_failure(abort_code = 7, location = deepvol::fees)]
fun receipt_rejects_zero_premium() {
    let mut ctx = tx_context::dummy();
    let series = series::new_series_for_testing(
        CREATOR,
        object::id_from_address(ORACLE),
        EXPIRY,
        LOWER_STRIKE,
        UPPER_STRIKE,
        fees::default_create_fee_bps(),
        b"ipfs://deepvol-series",
        CREATED_AT_MS,
        &mut ctx,
    );

    let receipt = receipt::new_receipt_for_testing(
        OWNER,
        &series,
        object::id_from_address(MANAGER),
        QUANTITY,
        0,
        CREATED_AT_MS,
        &mut ctx,
    );
    receipt::destroy_for_testing(receipt);
    series::destroy_for_testing(series);
    abort 999
}

#[test]
fun new_receipt_stores_expected_fields() {
    let mut ctx = tx_context::dummy();
    let series = series::new_series_for_testing(
        CREATOR,
        object::id_from_address(ORACLE),
        EXPIRY,
        LOWER_STRIKE,
        UPPER_STRIKE,
        fees::default_create_fee_bps(),
        b"ipfs://deepvol-series",
        CREATED_AT_MS,
        &mut ctx,
    );
    let series_id = series::id(&series);
    let manager_id = object::id_from_address(MANAGER);
    let receipt = receipt::new_receipt_for_testing(
        OWNER,
        &series,
        manager_id,
        QUANTITY,
        PREMIUM_PAID,
        CREATED_AT_MS,
        &mut ctx,
    );

    assert_eq!(receipt::owner_for_testing(&receipt), OWNER);
    assert_eq!(receipt::series_id_for_testing(&receipt), series_id);
    assert_eq!(receipt::predict_manager_id_for_testing(&receipt), manager_id);
    assert_eq!(receipt::oracle_id_for_testing(&receipt), object::id_from_address(ORACLE));
    assert_eq!(receipt::expiry_for_testing(&receipt), EXPIRY);
    assert_eq!(receipt::lower_strike_for_testing(&receipt), LOWER_STRIKE);
    assert_eq!(receipt::upper_strike_for_testing(&receipt), UPPER_STRIKE);
    assert_eq!(receipt::up_strike_for_testing(&receipt), UPPER_STRIKE);
    assert_eq!(receipt::down_strike_for_testing(&receipt), LOWER_STRIKE);
    assert_eq!(receipt::quantity_for_testing(&receipt), QUANTITY);
    assert_eq!(receipt::premium_paid_for_testing(&receipt), PREMIUM_PAID);
    assert_eq!(receipt::create_fee_paid_for_testing(&receipt), 3);
    assert_eq!(receipt::created_at_ms_for_testing(&receipt), CREATED_AT_MS);
    assert_eq!(receipt::status_for_testing(&receipt), receipt::status_active());

    receipt::destroy_for_testing(receipt);
    series::destroy_for_testing(series);
}

#[test, expected_failure(abort_code = 3, location = deepvol::receipt)]
fun mark_receipt_settled_requires_owner() {
    let mut ctx = tx_context::dummy();
    let series = series::new_series_for_testing(
        CREATOR,
        object::id_from_address(ORACLE),
        EXPIRY,
        LOWER_STRIKE,
        UPPER_STRIKE,
        fees::default_create_fee_bps(),
        b"ipfs://deepvol-series",
        CREATED_AT_MS,
        &mut ctx,
    );
    let mut receipt = receipt::new_receipt_for_testing(
        OWNER,
        &series,
        object::id_from_address(MANAGER),
        QUANTITY,
        PREMIUM_PAID,
        CREATED_AT_MS,
        &mut ctx,
    );

    receipt::mark_settled_for_testing(&mut receipt, UNAUTHORIZED, SETTLED_AT_MS);

    receipt::destroy_for_testing(receipt);
    series::destroy_for_testing(series);
    abort 999
}

#[test]
fun mark_receipt_settled_updates_status() {
    let mut ctx = tx_context::dummy();
    let series = series::new_series_for_testing(
        CREATOR,
        object::id_from_address(ORACLE),
        EXPIRY,
        LOWER_STRIKE,
        UPPER_STRIKE,
        fees::default_create_fee_bps(),
        b"ipfs://deepvol-series",
        CREATED_AT_MS,
        &mut ctx,
    );
    let mut receipt = receipt::new_receipt_for_testing(
        OWNER,
        &series,
        object::id_from_address(MANAGER),
        QUANTITY,
        PREMIUM_PAID,
        CREATED_AT_MS,
        &mut ctx,
    );

    receipt::mark_settled_for_testing(&mut receipt, OWNER, SETTLED_AT_MS);

    assert_eq!(receipt::status_for_testing(&receipt), receipt::status_settled());

    receipt::destroy_for_testing(receipt);
    series::destroy_for_testing(series);
}

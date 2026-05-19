#[test_only]
module deepvol::deepvol_tests;

use deepvol::{fees, receipt, series, vault};
use std::unit_test::assert_eq;
use sui::{coin::mint_for_testing, sui::SUI};

const CREATOR: address = @0xA;
const OWNER: address = @0xB;
const UNAUTHORIZED: address = @0xC;
const ORACLE: address = @0xD;
const MANAGER: address = @0xE;
const RECIPIENT: address = @0xF;
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
    let series = new_series(&mut ctx);

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
    let mut series = new_series(&mut ctx);

    series::deactivate_for_testing(&mut series, UNAUTHORIZED, SETTLED_AT_MS);

    series::destroy_for_testing(series);
    abort 999
}

#[test]
fun deactivate_series_marks_inactive() {
    let mut ctx = tx_context::dummy();
    let mut series = new_series(&mut ctx);

    series::deactivate_for_testing(&mut series, CREATOR, SETTLED_AT_MS);

    assert!(!series::is_active(&series));

    series::destroy_for_testing(series);
}

#[test]
fun protocol_vault_starts_empty() {
    let mut ctx = tx_context::dummy();
    let vault = vault::new_protocol_vault_for_testing<SUI>(&mut ctx);

    assert_eq!(vault::protocol_vault_balance(&vault), 0);

    vault::destroy_empty_protocol_vault_for_testing(vault);
}

#[test]
fun deposit_create_fee_increases_vault_balance() {
    let mut ctx = tx_context::dummy();
    let mut vault = vault::new_protocol_vault_for_testing<SUI>(&mut ctx);

    vault::deposit_create_fee_for_testing(
        &mut vault,
        mint_for_testing<SUI>(1_000, &mut ctx),
        object::id_from_address(ORACLE),
        OWNER,
        CREATED_AT_MS,
    );

    assert_eq!(vault::protocol_vault_balance(&vault), 1_000);

    let admin_cap = vault::new_admin_cap_for_testing(&mut ctx);
    vault::withdraw_protocol_fees_for_testing(&admin_cap, &mut vault, 1_000, RECIPIENT, &mut ctx);
    vault::destroy_empty_protocol_vault_for_testing(vault);
    vault::destroy_admin_cap_for_testing(admin_cap);
}

#[test]
fun withdraw_protocol_fees_reduces_vault_balance() {
    let mut ctx = tx_context::dummy();
    let admin_cap = vault::new_admin_cap_for_testing(&mut ctx);
    let mut vault = vault::new_protocol_vault_for_testing<SUI>(&mut ctx);

    vault::deposit_create_fee_for_testing(
        &mut vault,
        mint_for_testing<SUI>(1_000, &mut ctx),
        object::id_from_address(ORACLE),
        OWNER,
        CREATED_AT_MS,
    );

    vault::withdraw_protocol_fees_for_testing(&admin_cap, &mut vault, 400, RECIPIENT, &mut ctx);

    assert_eq!(vault::protocol_vault_balance(&vault), 600);

    vault::withdraw_protocol_fees_for_testing(&admin_cap, &mut vault, 600, RECIPIENT, &mut ctx);
    vault::destroy_empty_protocol_vault_for_testing(vault);
    vault::destroy_admin_cap_for_testing(admin_cap);
}

#[test, expected_failure(abort_code = 13, location = deepvol::vault)]
fun withdraw_protocol_fees_requires_available_balance() {
    let mut ctx = tx_context::dummy();
    let admin_cap = vault::new_admin_cap_for_testing(&mut ctx);
    let mut vault = vault::new_protocol_vault_for_testing<SUI>(&mut ctx);

    vault::deposit_create_fee_for_testing(
        &mut vault,
        mint_for_testing<SUI>(100, &mut ctx),
        object::id_from_address(ORACLE),
        OWNER,
        CREATED_AT_MS,
    );
    vault::withdraw_protocol_fees_for_testing(&admin_cap, &mut vault, 101, RECIPIENT, &mut ctx);

    abort 999
}

#[test, expected_failure(abort_code = 0, location = deepvol::receipt)]
fun receipt_rejects_inactive_series() {
    let mut ctx = tx_context::dummy();
    let mut series = new_series(&mut ctx);
    series::deactivate_for_testing(&mut series, CREATOR, SETTLED_AT_MS);

    let receipt = receipt::new_receipt_for_testing(
        OWNER,
        &series,
        object::id_from_address(MANAGER),
        QUANTITY,
        PREMIUM_PAID,
        fees::calculate_create_fee(PREMIUM_PAID, fees::default_create_fee_bps()),
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
    let series = new_series(&mut ctx);

    let receipt = receipt::new_receipt_for_testing(
        OWNER,
        &series,
        object::id_from_address(MANAGER),
        0,
        PREMIUM_PAID,
        fees::calculate_create_fee(PREMIUM_PAID, fees::default_create_fee_bps()),
        CREATED_AT_MS,
        &mut ctx,
    );
    receipt::destroy_for_testing(receipt);
    series::destroy_for_testing(series);
    abort 999
}

#[test, expected_failure(abort_code = 7, location = deepvol::receipt)]
fun receipt_rejects_zero_premium() {
    let mut ctx = tx_context::dummy();
    let series = new_series(&mut ctx);

    let receipt = receipt::new_receipt_for_testing(
        OWNER,
        &series,
        object::id_from_address(MANAGER),
        QUANTITY,
        0,
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
    let series = new_series(&mut ctx);
    let series_id = series::id(&series);
    let manager_id = object::id_from_address(MANAGER);
    let create_fee_paid = fees::calculate_create_fee(PREMIUM_PAID, fees::default_create_fee_bps());
    let receipt = receipt::new_receipt_for_testing(
        OWNER,
        &series,
        manager_id,
        QUANTITY,
        PREMIUM_PAID,
        create_fee_paid,
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
    assert_eq!(receipt::up_strike_for_testing(&receipt), series::upper_strike(&series));
    assert_eq!(receipt::down_strike_for_testing(&receipt), series::lower_strike(&series));
    assert_eq!(receipt::quantity_for_testing(&receipt), QUANTITY);
    assert_eq!(receipt::premium_paid_for_testing(&receipt), PREMIUM_PAID);
    assert_eq!(receipt::create_fee_paid_for_testing(&receipt), create_fee_paid);
    assert_eq!(receipt::created_at_ms_for_testing(&receipt), CREATED_AT_MS);
    assert_eq!(receipt::status_for_testing(&receipt), receipt::status_active());

    receipt::destroy_for_testing(receipt);
    series::destroy_for_testing(series);
}

#[test, expected_failure(abort_code = 3, location = deepvol::receipt)]
fun mark_receipt_settled_requires_owner() {
    let mut ctx = tx_context::dummy();
    let series = new_series(&mut ctx);
    let mut receipt = new_receipt(&series, &mut ctx);

    receipt::mark_settled_for_testing(&mut receipt, UNAUTHORIZED, SETTLED_AT_MS);

    receipt::destroy_for_testing(receipt);
    series::destroy_for_testing(series);
    abort 999
}

#[test]
fun mark_receipt_settled_updates_status() {
    let mut ctx = tx_context::dummy();
    let series = new_series(&mut ctx);
    let mut receipt = new_receipt(&series, &mut ctx);

    receipt::mark_settled_for_testing(&mut receipt, OWNER, SETTLED_AT_MS);

    assert_eq!(receipt::status_for_testing(&receipt), receipt::status_settled());

    receipt::destroy_for_testing(receipt);
    series::destroy_for_testing(series);
}

#[test, expected_failure(abort_code = 8, location = deepvol::receipt)]
fun mark_receipt_settled_rejects_already_settled() {
    let mut ctx = tx_context::dummy();
    let series = new_series(&mut ctx);
    let mut receipt = new_receipt(&series, &mut ctx);

    receipt::mark_settled_for_testing(&mut receipt, OWNER, SETTLED_AT_MS);
    receipt::mark_settled_for_testing(&mut receipt, OWNER, SETTLED_AT_MS + 1);

    receipt::destroy_for_testing(receipt);
    series::destroy_for_testing(series);
    abort 999
}

fun new_series(ctx: &mut TxContext): series::VolSeries {
    series::new_series_for_testing(
        CREATOR,
        object::id_from_address(ORACLE),
        EXPIRY,
        LOWER_STRIKE,
        UPPER_STRIKE,
        fees::default_create_fee_bps(),
        b"ipfs://deepvol-series",
        CREATED_AT_MS,
        ctx,
    )
}

fun new_receipt(series: &series::VolSeries, ctx: &mut TxContext): receipt::MoveReceipt {
    receipt::new_receipt_for_testing(
        OWNER,
        series,
        object::id_from_address(MANAGER),
        QUANTITY,
        PREMIUM_PAID,
        fees::calculate_create_fee(PREMIUM_PAID, fees::default_create_fee_bps()),
        CREATED_AT_MS,
        ctx,
    )
}

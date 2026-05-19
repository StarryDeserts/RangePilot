module deepvol::receipt;

use deepvol::{errors, fees, series::{Self, VolSeries}};
use sui::{clock::Clock, event};

const STATUS_ACTIVE: u8 = 0;
const STATUS_SETTLED: u8 = 1;
const STATUS_CANCELLED: u8 = 2;

public struct MoveReceipt has key {
    id: UID,
    owner: address,
    series_id: ID,
    predict_manager_id: ID,
    oracle_id: ID,
    expiry: u64,
    lower_strike: u64,
    upper_strike: u64,
    up_strike: u64,
    down_strike: u64,
    quantity: u64,
    premium_paid: u64,
    create_fee_paid: u64,
    created_at_ms: u64,
    status: u8,
}

public struct MoveReceiptCreated has copy, drop {
    receipt_id: ID,
    owner: address,
    series_id: ID,
    predict_manager_id: ID,
    oracle_id: ID,
    expiry: u64,
    lower_strike: u64,
    upper_strike: u64,
    up_strike: u64,
    down_strike: u64,
    quantity: u64,
    premium_paid: u64,
    create_fee_paid: u64,
    timestamp_ms: u64,
}

public struct MoveReceiptMarkedSettled has copy, drop {
    receipt_id: ID,
    owner: address,
    timestamp_ms: u64,
}

public fun status_active(): u8 {
    STATUS_ACTIVE
}

public fun status_settled(): u8 {
    STATUS_SETTLED
}

public fun status_cancelled(): u8 {
    STATUS_CANCELLED
}

public entry fun create_move_receipt(
    series: &VolSeries,
    predict_manager_id: ID,
    quantity: u64,
    premium_paid: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let receipt = new_receipt(
        ctx.sender(),
        series,
        predict_manager_id,
        quantity,
        premium_paid,
        clock.timestamp_ms(),
        ctx,
    );
    let receipt_id = object::id(&receipt);

    event::emit(MoveReceiptCreated {
        receipt_id,
        owner: receipt.owner,
        series_id: receipt.series_id,
        predict_manager_id: receipt.predict_manager_id,
        oracle_id: receipt.oracle_id,
        expiry: receipt.expiry,
        lower_strike: receipt.lower_strike,
        upper_strike: receipt.upper_strike,
        up_strike: receipt.up_strike,
        down_strike: receipt.down_strike,
        quantity: receipt.quantity,
        premium_paid: receipt.premium_paid,
        create_fee_paid: receipt.create_fee_paid,
        timestamp_ms: receipt.created_at_ms,
    });

    transfer::transfer(receipt, ctx.sender());
}

public entry fun mark_receipt_settled(
    receipt: &mut MoveReceipt,
    clock: &Clock,
    ctx: &TxContext,
) {
    mark_settled(receipt, ctx.sender(), clock.timestamp_ms());
}

fun new_receipt(
    owner: address,
    series: &VolSeries,
    predict_manager_id: ID,
    quantity: u64,
    premium_paid: u64,
    created_at_ms: u64,
    ctx: &mut TxContext,
): MoveReceipt {
    assert!(series::is_active(series), errors::inactive_series());
    assert!(quantity > 0, errors::zero_quantity());

    let create_fee_paid = fees::calculate_create_fee(premium_paid, series::create_fee_bps(series));
    let lower_strike = series::lower_strike(series);
    let upper_strike = series::upper_strike(series);

    MoveReceipt {
        id: object::new(ctx),
        owner,
        series_id: series::id(series),
        predict_manager_id,
        oracle_id: series::oracle_id(series),
        expiry: series::expiry(series),
        lower_strike,
        upper_strike,
        up_strike: upper_strike,
        down_strike: lower_strike,
        quantity,
        premium_paid,
        create_fee_paid,
        created_at_ms,
        status: STATUS_ACTIVE,
    }
}

fun mark_settled(receipt: &mut MoveReceipt, sender: address, timestamp_ms: u64) {
    assert!(sender == receipt.owner, errors::unauthorized());
    assert!(receipt.status == STATUS_ACTIVE, errors::invalid_receipt_status());

    receipt.status = STATUS_SETTLED;

    event::emit(MoveReceiptMarkedSettled {
        receipt_id: object::id(receipt),
        owner: receipt.owner,
        timestamp_ms,
    });
}

#[test_only]
public fun new_receipt_for_testing(
    owner: address,
    series: &VolSeries,
    predict_manager_id: ID,
    quantity: u64,
    premium_paid: u64,
    created_at_ms: u64,
    ctx: &mut TxContext,
): MoveReceipt {
    new_receipt(
        owner,
        series,
        predict_manager_id,
        quantity,
        premium_paid,
        created_at_ms,
        ctx,
    )
}

#[test_only]
public fun mark_settled_for_testing(receipt: &mut MoveReceipt, sender: address, timestamp_ms: u64) {
    mark_settled(receipt, sender, timestamp_ms);
}

#[test_only]
public fun destroy_for_testing(receipt: MoveReceipt) {
    let MoveReceipt { id, .. } = receipt;
    id.delete();
}

#[test_only]
public fun owner_for_testing(receipt: &MoveReceipt): address {
    receipt.owner
}

#[test_only]
public fun series_id_for_testing(receipt: &MoveReceipt): ID {
    receipt.series_id
}

#[test_only]
public fun predict_manager_id_for_testing(receipt: &MoveReceipt): ID {
    receipt.predict_manager_id
}

#[test_only]
public fun oracle_id_for_testing(receipt: &MoveReceipt): ID {
    receipt.oracle_id
}

#[test_only]
public fun expiry_for_testing(receipt: &MoveReceipt): u64 {
    receipt.expiry
}

#[test_only]
public fun lower_strike_for_testing(receipt: &MoveReceipt): u64 {
    receipt.lower_strike
}

#[test_only]
public fun upper_strike_for_testing(receipt: &MoveReceipt): u64 {
    receipt.upper_strike
}

#[test_only]
public fun up_strike_for_testing(receipt: &MoveReceipt): u64 {
    receipt.up_strike
}

#[test_only]
public fun down_strike_for_testing(receipt: &MoveReceipt): u64 {
    receipt.down_strike
}

#[test_only]
public fun quantity_for_testing(receipt: &MoveReceipt): u64 {
    receipt.quantity
}

#[test_only]
public fun premium_paid_for_testing(receipt: &MoveReceipt): u64 {
    receipt.premium_paid
}

#[test_only]
public fun create_fee_paid_for_testing(receipt: &MoveReceipt): u64 {
    receipt.create_fee_paid
}

#[test_only]
public fun created_at_ms_for_testing(receipt: &MoveReceipt): u64 {
    receipt.created_at_ms
}

#[test_only]
public fun status_for_testing(receipt: &MoveReceipt): u8 {
    receipt.status
}

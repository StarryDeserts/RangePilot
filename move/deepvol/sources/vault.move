module deepvol::vault;

use deepvol::errors;
use sui::{balance::{Self, Balance}, coin::{Self, Coin}, event};

public struct VAULT has drop {}

public struct AdminCap has key, store {
    id: UID,
}

public struct ProtocolVault<phantom T> has key {
    id: UID,
    balance: Balance<T>,
}

public struct ProtocolVaultCreated has copy, drop {
    vault_id: ID,
    admin: address,
}

public struct CreateFeeDeposited has copy, drop {
    vault_id: ID,
    series_id: ID,
    owner: address,
    amount: u64,
    timestamp_ms: u64,
}

public struct ProtocolFeesWithdrawn has copy, drop {
    vault_id: ID,
    recipient: address,
    amount: u64,
}

fun init(_witness: VAULT, ctx: &mut TxContext) {
    transfer::transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
}

public entry fun create_protocol_vault<T>(
    _admin_cap: &AdminCap,
    ctx: &mut TxContext,
) {
    let vault = ProtocolVault<T> {
        id: object::new(ctx),
        balance: balance::zero<T>(),
    };
    let vault_id = object::id(&vault);

    event::emit(ProtocolVaultCreated {
        vault_id,
        admin: ctx.sender(),
    });

    transfer::share_object(vault);
}

public fun protocol_vault_balance<T>(vault: &ProtocolVault<T>): u64 {
    balance::value(&vault.balance)
}

public entry fun withdraw_protocol_fees<T>(
    admin_cap: &AdminCap,
    vault: &mut ProtocolVault<T>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    withdraw_protocol_fees_internal(admin_cap, vault, amount, recipient, ctx);
}

public(package) fun deposit_create_fee<T>(
    vault: &mut ProtocolVault<T>,
    fee: Coin<T>,
    series_id: ID,
    owner: address,
    timestamp_ms: u64,
) {
    let amount = coin::value(&fee);
    balance::join(&mut vault.balance, coin::into_balance(fee));

    event::emit(CreateFeeDeposited {
        vault_id: object::id(vault),
        series_id,
        owner,
        amount,
        timestamp_ms,
    });
}

fun withdraw_protocol_fees_internal<T>(
    _admin_cap: &AdminCap,
    vault: &mut ProtocolVault<T>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    assert!(balance::value(&vault.balance) >= amount, errors::insufficient_protocol_vault_balance());

    let withdrawn = coin::from_balance(balance::split(&mut vault.balance, amount), ctx);
    transfer::public_transfer(withdrawn, recipient);

    event::emit(ProtocolFeesWithdrawn {
        vault_id: object::id(vault),
        recipient,
        amount,
    });
}

#[test_only]
public fun new_admin_cap_for_testing(ctx: &mut TxContext): AdminCap {
    AdminCap { id: object::new(ctx) }
}

#[test_only]
public fun destroy_admin_cap_for_testing(admin_cap: AdminCap) {
    let AdminCap { id } = admin_cap;
    id.delete();
}

#[test_only]
public fun new_protocol_vault_for_testing<T>(ctx: &mut TxContext): ProtocolVault<T> {
    ProtocolVault<T> { id: object::new(ctx), balance: balance::zero<T>() }
}

#[test_only]
public fun destroy_empty_protocol_vault_for_testing<T>(vault: ProtocolVault<T>) {
    let ProtocolVault { id, balance } = vault;
    balance::destroy_zero(balance);
    id.delete();
}

#[test_only]
public fun deposit_create_fee_for_testing<T>(
    vault: &mut ProtocolVault<T>,
    fee: Coin<T>,
    series_id: ID,
    owner: address,
    timestamp_ms: u64,
) {
    deposit_create_fee(vault, fee, series_id, owner, timestamp_ms);
}

#[test_only]
public fun withdraw_protocol_fees_for_testing<T>(
    admin_cap: &AdminCap,
    vault: &mut ProtocolVault<T>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    withdraw_protocol_fees_internal(admin_cap, vault, amount, recipient, ctx);
}

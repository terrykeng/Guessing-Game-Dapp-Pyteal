from pyteal import *
from pyteal.ast.bytes import Bytes


router = Router(
    "Guessing Game",
    BareCallActions(
        no_op=OnCompleteAction.create_only(Approve()),
        opt_in=OnCompleteAction.call_only(Approve())
    )
)

player1 = Bytes("player1")
player2 = Bytes("player2")
wager = Bytes("wager")
l_p = Bytes("l_p1")
seed = Bytes("p1Rand")
addresses = []


@router.method
def create_challenge(rand: abi.String, payment: abi.PaymentTransaction):
    return Seq(
        Assert(
            And(
                payment.get().type_enum() == TxnType.Payment,
                payment.get().receiver() == Global.current_application_address(),
                payment.get().close_remainder_to() == Global.zero_address(),
                App.optedIn(payment.get().sender(), Global.current_application_id()),
            )
        ),
        App.globalPut(player1, payment.get().sender()),
        Assert(payment.get().sender() == App.globalGet(Bytes("player1"))),
        App.globalPut(wager, payment.get().amount()),
        App.globalPut(seed, rand.get()),
        Approve(),
    )


@router.method
def show_seed(*, output: abi.Uint64):
    return output.set(App.globalGet(seed))


@router.method
def accept_challenge(payment: abi.PaymentTransaction):
    return Seq(
        Assert(
            And(
                payment.get().type_enum() == TxnType.Payment,
                payment.get().receiver() == Global.current_application_address(),
                payment.get().close_remainder_to() == Global.zero_address(),
                App.globalGet(wager) == payment.get().amount(),
                App.optedIn(payment.get().sender(), Global.current_application_id()),
            )
        ),
        App.globalPut(player2, payment.get().sender()),
        Approve(),
    )


@router.method
def play_value(p: abi.String):
    return Seq(
        Assert(App.optedIn(Txn.sender(), Global.current_application_id())),
        If(Txn.sender() == App.globalGet(Bytes("player1"))).Then(
            App.localPut(Txn.sender(), l_p, p.get()),
        ).ElseIf(Txn.sender() == App.globalGet(Bytes("player2"))).Then(
            App.localPut(Txn.sender(), l_p, p.get()),
        ),
        Approve(),
    )


@router.method
def show_play(*, output: abi.String):
    return output.set(Base64Decode.std(App.localGet(App.globalGet(Bytes("player1")), l_p)))


@Subroutine(TealType.uint64)
def winner(play1: Expr, play2: Expr):
    return Seq(
        Return(
            Cond(
                [
                    And(
                        Base64Decode.std(play1) == Base64Decode.std(App.globalGet(seed)),
                        Base64Decode.std(play2) == Base64Decode.std(App.globalGet(seed))
                    ),
                    Int(3)
                ],
                [
                    And(
                        Base64Decode.std(play1) == Base64Decode.std(App.globalGet(seed)),
                        Base64Decode.std(play2) != Base64Decode.std(App.globalGet(seed))
                    ),
                    Int(1)
                ],
                [
                    And(
                        Base64Decode.std(play1) != Base64Decode.std(App.globalGet(seed)),
                        Base64Decode.std(play2) == Base64Decode.std(App.globalGet(seed))
                    ),
                    Int(2)
                ]
            )
        )
    )


@Subroutine(TealType.none)
def send_rewards(account: Expr, amount: Expr):
    return Seq(
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: account,
                TxnField.amount: amount,
            }
        ),
        InnerTxnBuilder.Submit(),
    )


@router.method
def reveal(account1: abi.Account, account2: abi.Account, *, output: abi.Uint64):
    Assert(Txn.sender() == App.globalGet(Bytes("player1"))),

    var = winner(App.localGet(account1.address(), l_p), App.localGet(account2.address(), l_p))

    p = "Player 1 Won"
    p2 = "Player 2 Won"
    p3 = "Draw"
    p4 = "No one won"
    return Seq(
        If(var == Int(3)).Then(
            Seq(
                send_rewards(account1.address(), App.globalGet(wager) - (App.globalGet(wager) * Int(15) / Int(100))),
                send_rewards(account2.address(), App.globalGet(wager) - (App.globalGet(wager) * Int(15) / Int(100))),
                reset_all(account1.address(), account2.address()),
            )
        ).ElseIf(var == Int(2)).Then(
            Seq(
                send_rewards(account2.address(), App.globalGet(wager) * Int(2) - (App.globalGet(wager) * Int(15) / Int(100))),
                reset_all(account1.address(), account2.address()),
            )
        ).ElseIf(var == Int(1)).Then(
            Seq(
                send_rewards(account1.address(), App.globalGet(wager) * Int(2) - (App.globalGet(wager) * Int(15) / Int(100))),
                reset_all(account1.address(), account2.address()),
            )
        ).Else(
            reset_all(account1.address(), account2.address()),
        ),
        Approve(),
    )


@router.method
def show_winner(account1: abi.Account, account2: abi.Account, *, output: abi.Uint64):
    return output.set(winner(App.localGet(account1.address(), l_p), App.localGet(account2.address(), l_p)))


@router.method
def getPlayer1(*, output: abi.Address):
    return Seq(
        output.set(App.globalGet(Bytes("player1"))),
    )


@router.method
def getPlayer2(*, output: abi.Address):
    return Seq(
        output.set(App.globalGet(Bytes("player2"))),
    )


@Subroutine(TealType.none)
def reset_all(acc1: Expr, acc2: Expr):
    return Seq(
        App.localPut(acc1, l_p, Bytes("")),
        App.localPut(acc2, l_p, Bytes("")),
        App.globalPut(seed, Int(0)),
        App.globalPut(wager, Int(0)),
    )


if __name__ == "__main__":
    import os
    import json

    path = os.path.dirname(os.path.abspath(__file__))
    approval, clear, contract = router.compile_program(version=8)

    # Dump out the contract as json that can be read in by any of the SDKs
    with open(os.path.join(path, "artifacts/contract.json"), "w") as f:
        f.write(json.dumps(contract.dictify(), indent=2))

    # Write out the approval and clear programs
    with open(os.path.join(path, "artifacts/approval.teal"), "w") as f:
        f.write(approval)

    with open(os.path.join(path, "artifacts/clear.teal"), "w") as f:
        f.write(clear)

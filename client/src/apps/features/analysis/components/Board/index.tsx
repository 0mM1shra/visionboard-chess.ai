import React, { useMemo, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Piece, Square } from "react-chessboard/dist/chessboard/types";
import { Chess, Move, PieceSymbol } from "chess.js";

import { defaultRootNode } from "shared/constants/utils";
import { isMovePromotion } from "shared/lib/utils/chess";
import useResizeObserver from "@/hooks/useResizeObserver";
import PlayerProfile from "@/components/chess/PlayerProfile";
import EvaluationBar from "../EvaluationBar";

import { useSquares } from "./squares/useSquares";
import createSquareRenderer from "./squares/SquareRenderer";
import { SquaresContext } from "./squares/SquaresContext";

import BoardProps from "./BoardProps";
import * as styles from "./Board.module.css";

type ClickMove = Pick<Move, "from" | "to">;

function getPieceType(piece: Piece) {
    return piece.at(1)?.toLowerCase() as PieceSymbol;
}

function getCapturedPieces(fen: string) {
    const activePieces = fen.split(" ")[0].replace(/[^a-zA-Z]/g, "");
    const counts: Record<string, number> = {
        P: 0, N: 0, B: 0, R: 0, Q: 0,
        p: 0, n: 0, b: 0, r: 0, q: 0
    };
    for (const char of activePieces) {
        if (counts[char] !== undefined) {
            counts[char]++;
        }
    }
    const capturedByWhite: { type: string, value: number, symbol: string }[] = [];
    const capturedByBlack: { type: string, value: number, symbol: string }[] = [];
    const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, P: 1, N: 3, B: 3, R: 5, Q: 9 };
    const symbols: Record<string, string> = { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", P: "♙", N: "♘", B: "♗", R: "♖", Q: "♕" };
    const startingCountsWhite = { P: 8, N: 2, B: 2, R: 2, Q: 1 };
    const startingCountsBlack = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    let totalValueWhiteActive = 0;
    let totalValueBlackActive = 0;
    for (const [piece, max] of Object.entries(startingCountsBlack)) {
        const active = counts[piece] || 0;
        const captured = max - active;
        totalValueBlackActive += active * values[piece];
        for (let i = 0; i < captured; i++) {
            capturedByWhite.push({ type: piece, value: values[piece], symbol: symbols[piece] });
        }
    }
    for (const [piece, max] of Object.entries(startingCountsWhite)) {
        const active = counts[piece] || 0;
        const captured = max - active;
        totalValueWhiteActive += active * values[piece];
        for (let i = 0; i < captured; i++) {
            capturedByBlack.push({ type: piece, value: values[piece], symbol: symbols[piece] });
        }
    }
    const advantage = totalValueWhiteActive - totalValueBlackActive;
    return { capturedByWhite, capturedByBlack, advantage };
}

function Board({
    className,
    style,
    profileClassName,
    profileStyle,
    whiteProfile,
    blackProfile,
    theme,
    piecesDraggable = true,
    node = defaultRootNode,
    flipped,
    evaluation,
    arrows,
    enableClassifications = true,
    onAddMove
}: BoardProps) {
    const squares = useSquares();

    const squareRenderer = useMemo(() => (
        createSquareRenderer(node, enableClassifications)
    ), [node, enableClassifications]);

    const [ heldPromotion, setHeldPromotion ] = useState<ClickMove>();

    const boardContainerRef = useRef<HTMLDivElement | null>(null);
    const { fullWidth: boardWidth } = useResizeObserver(boardContainerRef, 1);

    const topProfile = flipped ? whiteProfile : blackProfile;
    const bottomProfile = flipped ? blackProfile : whiteProfile;

    const { capturedByWhite, capturedByBlack, advantage } = getCapturedPieces(node.state.fen);

    const isTopWhite = flipped;
    const topCaptured = isTopWhite ? capturedByWhite : capturedByBlack;
    const topAdvantageVal = isTopWhite ? advantage : -advantage;
    const topAdvantageText = topAdvantageVal > 0 ? `+${topAdvantageVal}` : undefined;

    const isBottomWhite = !flipped;
    const bottomCaptured = isBottomWhite ? capturedByWhite : capturedByBlack;
    const bottomAdvantageVal = isBottomWhite ? advantage : -advantage;
    const bottomAdvantageText = bottomAdvantageVal > 0 ? `+${bottomAdvantageVal}` : undefined;

    function onSquareClick(square: Square, piece?: Piece) {
        squares.setHighlighted([]);

        if (!piece || square == squares.selected) {
            squares.setSelected(undefined);
            squares.clearPlayable();
        } else {
            squares.setSelected(square);
            squares.loadPlayable(node.state.fen, square);
        }

        if (!squares.selected) return;
        if (
            !squares.playable.includes(square)
            && !squares.capturable.includes(square)
        ) return;

        const selectedPiece = new Chess(node.state.fen)
            .get(squares.selected);

        if (selectedPiece && isMovePromotion(selectedPiece.type, square)) {
            setHeldPromotion({
                from: squares.selected,
                to: square
            });
        }

        addMove(squares.selected, square);
    }

    function onPromotionPieceSelect(
        piece?: Piece, from?: Square, to?: Square
    ) {
        if (!piece || !to) return false;

        setHeldPromotion(undefined);

        const fromSquare = heldPromotion?.from || from;
        if (!fromSquare) return false;
        
        return addMove(fromSquare, to, getPieceType(piece));
    }

    function addMove(
        from: Square, to: Square, promotion?: PieceSymbol,
        drop?: boolean
    ) {
        try {
            const move = new Chess(node.state.fen)
                .move({ from, to, promotion });

            squares.setPieceDropFlag(drop || false);

            return onAddMove?.(move) || true;
        } catch {
            return false;
        }
    }

    return <div
        className={`${styles.wrapper} ${className}`}
        style={style}
    >
        {topProfile && <div
            className={`${styles.profile} ${profileClassName}`}
            style={{ borderRadius: "7px 7px 0 0", ...profileStyle }}
        >
            <PlayerProfile profile={topProfile} captured={topCaptured} advantage={topAdvantageText} />
        </div>}

        <div className={styles.boardContainer} ref={boardContainerRef}>
            {evaluation && <EvaluationBar
                evaluation={evaluation}
                moveColour={node.state.moveColour}
                flipped={flipped}
            />}

            <SquaresContext.Provider value={squares}>
                <Chessboard
                    position={node.state.fen}
                    boardOrientation={flipped ? "black" : "white"}
                    onSquareClick={onSquareClick}
                    onSquareRightClick={squares.toggleHighlight}
                    onPieceDragBegin={(piece, square) => {
                        squares.setSelected(square);
                        squares.loadPlayable(node.state.fen, square);
                    }}
                    onPieceDrop={(from, to, piece) => {
                        squares.setSelected(undefined);
                        squares.clearPlayable();

                        return addMove(from, to, getPieceType(piece), true);
                    }}
                    onPromotionPieceSelect={onPromotionPieceSelect}
                    customSquare={squareRenderer}
                    customArrows={arrows}
                    arePiecesDraggable={piecesDraggable}
                    customLightSquareStyle={theme?.lightSquareColour
                        ? { backgroundColor: theme.lightSquareColour }
                        : undefined
                    }
                    customDarkSquareStyle={theme?.darkSquareColour
                        ? { backgroundColor: theme.darkSquareColour }
                        : undefined
                    }
                    animationDuration={165}
                    showPromotionDialog={!!heldPromotion}
                    promotionToSquare={heldPromotion?.to}
                    promotionDialogVariant="vertical"
                    boardWidth={boardWidth - (evaluation ? 40 : 0)}
                />
            </SquaresContext.Provider>
        </div>

        {bottomProfile && <div
            className={`${styles.profile} ${profileClassName}`}
            style={{ borderRadius: "0 0 7px 7px", ...profileStyle }}
        >
            <PlayerProfile profile={bottomProfile} captured={bottomCaptured} advantage={bottomAdvantageText} />
        </div>}
    </div>;
}

export default Board;
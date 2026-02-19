import React, { useState, useEffect } from 'react';
import { Button, Card, SkeletonLoader } from './Shared';
import { dataService } from '../services/data';
import Icons from './Icons';

interface Poll {
    id: number;
    question: string;
    start_at: string;
    end_at: string;
    weighting_strategy: 'UNIT' | 'ALICUOTA';
    show_results_when: 'LIVE' | 'CLOSED';
    closed_at?: string;
    close_reason?: string;
}

interface PollResult {
    option_id: number;
    option_text: string;
    votes_count: number;
    weighted_sum: number;
    percentage: number;
}

interface PollOption {
    id: number;
    option_text: string;
    option_index: number;
}

export const PollsScreen: React.FC = () => {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [myVotes, setMyVotes] = useState<Record<number, number>>({}); // pollId -> optionId
    const [results, setResults] = useState<Record<number, PollResult[]>>({}); // pollId -> results
    const [pollOptions, setPollOptions] = useState<Record<number, PollOption[]>>({}); // pollId -> options
    const [selectedOption, setSelectedOption] = useState<Record<number, number>>({}); // pollId -> selectedOptionId
    const [votingLoading, setVotingLoading] = useState<Record<number, boolean>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const pollsData = await dataService.getPolls();
            setPolls(pollsData || []);

            // Load extra data for each poll
            const votes: Record<number, number> = {};
            const res: Record<number, PollResult[]> = {};
            const opts: Record<number, PollOption[]> = {};

            for (const poll of pollsData || []) {
                // Get My Vote
                const myVote = await dataService.getMyVote(poll.id);
                if (myVote) votes[poll.id] = myVote.option_id;
            }
            setMyVotes(votes);
            // setPollOptions(opts); // Will load in separate effect or after update
        } catch (error) {
            console.error('Error loading polls:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to load options and results when a poll is expanded or visible
    // For simplicity, let's load options for all active polls.
    useEffect(() => {
        if (polls.length > 0) {
            loadOptionsAndResults();
        }
    }, [polls]);

    const loadOptionsAndResults = async () => {
        const opts: Record<number, PollOption[]> = {};
        const res: Record<number, PollResult[]> = {};

        for (const poll of polls) {
            // Load Options
            try {
                const options = await dataService.getPollOptions(poll.id);
                opts[poll.id] = options;
            } catch (e) { console.error(`Error loading options for poll ${poll.id}`, e); }

            // Load Results if visible
            const isClosed = poll.closed_at || new Date() >= new Date(poll.end_at);
            const canViewResults = poll.show_results_when === 'LIVE' || (poll.show_results_when === 'CLOSED' && isClosed);

            if (canViewResults) {
                try {
                    const r = await dataService.getPollResults(poll.id);
                    res[poll.id] = r;
                } catch (e) { console.error(`Error loading results for poll ${poll.id}`, e); }
            }
        }
        setPollOptions(opts);
        setResults(res);
    };

    const handleVote = async (pollId: number) => {
        const optionId = selectedOption[pollId];
        if (!optionId) return;

        setVotingLoading(prev => ({ ...prev, [pollId]: true }));
        try {
            await dataService.submitVote(pollId, optionId);
            alert('Voto registrado exitosamente.');
            // Refresh data
            const myVote = await dataService.getMyVote(pollId);
            if (myVote) setMyVotes(prev => ({ ...prev, [pollId]: myVote.option_id }));

            // Refresh results if live
            const poll = polls.find(p => p.id === pollId);
            if (poll?.show_results_when === 'LIVE') {
                const r = await dataService.getPollResults(pollId);
                setResults(prev => ({ ...prev, [pollId]: r }));
            }
        } catch (error) {
            console.error('Error voting:', error);
            alert('Error al registrar voto. Verifique que la votación esté activa y no haya votado ya.');
        } finally {
            setVotingLoading(prev => ({ ...prev, [pollId]: false }));
        }
    };

    const filteredPolls = polls.filter(p => {
        const isClosed = p.closed_at || new Date() >= new Date(p.end_at);
        return activeTab === 'active' ? !isClosed : isClosed;
    });

    if (loading) return <SkeletonLoader className="h-64" />;

    return (
        <div className="p-4 max-w-2xl mx-auto pb-20">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Votaciones</h1>

            <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-6">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'active'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    Activas
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'history'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    Historial
                </button>
            </div>

            <div className="space-y-6">
                {filteredPolls.length === 0 ? (
                    <Card className="p-8 text-center text-gray-500">
                        <p>No hay votaciones en esta sección.</p>
                    </Card>
                ) : (
                    filteredPolls.map(poll => {
                        const hasVoted = !!myVotes[poll.id];
                        const pollResults = results[poll.id];
                        const options = pollOptions[poll.id] || [];
                        const isClosed = poll.closed_at || new Date() >= new Date(poll.end_at);

                        return (
                            <Card key={poll.id} className="p-5">
                                <div className="mb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                            {poll.weighting_strategy === 'ALICUOTA' ? 'Voto Ponderado' : '1 Unidad = 1 Voto'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Cierra: {new Date(poll.end_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{poll.question}</h3>
                                    {poll.closed_at && (
                                        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-2 rounded text-sm mb-4">
                                            Cierre Anticipado: {poll.close_reason}
                                        </div>
                                    )}
                                </div>

                                {/* Voting Section */}
                                {!isClosed && !hasVoted && (
                                    <div className="space-y-3">
                                        {options.map(opt => (
                                            <label key={opt.id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedOption[poll.id] === opt.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }`}>
                                                <input
                                                    type="radio"
                                                    name={`poll-${poll.id}`}
                                                    className="w-4 h-4 text-blue-600"
                                                    checked={selectedOption[poll.id] === opt.id}
                                                    onChange={() => setSelectedOption(prev => ({ ...prev, [poll.id]: opt.id }))}
                                                />
                                                <span className="ml-3 text-gray-900 dark:text-white">{opt.option_text}</span>
                                            </label>
                                        ))}
                                        <Button
                                            variant="primary"
                                            className="w-full mt-4"
                                            disabled={!selectedOption[poll.id] || votingLoading[poll.id]}
                                            onClick={() => handleVote(poll.id)}
                                        >
                                            {votingLoading[poll.id] ? 'Enviando...' : 'Votar'}
                                        </Button>
                                    </div>
                                )}

                                {/* Results Section */}
                                {(hasVoted || isClosed) && (
                                    <div className="space-y-4">
                                        {pollResults ? (
                                            <div className="space-y-3">
                                                {pollResults.map(res => (
                                                    <div key={res.option_id}>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                                {res.option_text}
                                                                {myVotes[poll.id] === res.option_id && <span className="ml-2 text-blue-500">(Tu voto)</span>}
                                                            </span>
                                                            <span className="text-gray-500">
                                                                {res.percentage}% ({res.votes_count} votos)
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                                            <div
                                                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                                                                style={{ width: `${res.percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <p className="text-xs text-center text-gray-500 mt-2">
                                                    Total votos: {pollResults.reduce((acc, curr) => acc + Number(curr.votes_count), 0)}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <Icons name="lockClosed" className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                                <p className="text-gray-500">
                                                    {hasVoted ? 'Gracias por tu voto.' : 'Votación cerrada.'}
                                                    <br />
                                                    Los resultados estarán disponibles al finalizar la votación.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};

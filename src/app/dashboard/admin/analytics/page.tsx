"use client";
import React, { useState, useEffect } from "react";
import { useWallet } from "../../../../contexts/WalletContext";
import { useReadContract, useReadContracts, useBlockNumber } from "wagmi";
import { Abi } from "viem";
import StrataForgeAdminABI from "../../../components/ABIs/StrataForgeAdminABI.json";
import StrataForgeAirdropFactoryABI from "../../../components/ABIs/StrataForgeAirdropFactoryABI.json";
import AdminDashboardLayout from "../AdminDashboardLayout";

const ADMIN_CONTRACT_ADDRESS =
  "0xBD8e7980DCFA4E41873D90046f77Faa90A068cAd" as const;
const AIRDROP_CONTRACT_ADDRESS =
  "0x195dcF2E5340b5Fd3EC4BDBB94ADFeF09919CC8d" as const;
const adminABI = StrataForgeAdminABI as Abi;
const airdropFactoryABI = StrataForgeAirdropFactoryABI as Abi;
const EXPLORER_URL = "https://sepolia.basescan.org/address";

interface AirdropInfo {
  distributor: string;
  token: string;
  creator: string;
  startTime: number;
  totalRecipients: number;
  dropAmount: number;
  tokenType: number;
  reserved: number;
}

interface FeePaidEvent {
  payer: string;
  recipients: number;
  amountETH: bigint;
  amountUSD: bigint;
  timestamp: number;
}

interface AirdropCreatedEvent {
  creator: string;
  distributor: string;
  token: string;
  tokenType: number;
  totalRecipients: number;
  airdropIndex: number;
  timestamp: number;
}

const AnalyticsReports = () => {
  const { address, isConnected } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [feePaidEvents, setFeePaidEvents] = useState<FeePaidEvent[]>([]);
  const [airdropCreatedEvents, setAirdropCreatedEvents] = useState<
    AirdropCreatedEvent[]
  >([]);
  const [activeAirdrops, setActiveAirdrops] = useState<AirdropInfo[]>([]);
  const [reportGenerated, setReportGenerated] = useState(false);

  const {
    data: adminCount,
    error: adminCountError,
    isLoading: adminCountLoading,
    isSuccess: adminCountSuccess,
  } = useReadContract({
    address: ADMIN_CONTRACT_ADDRESS,
    abi: adminABI,
    functionName: "adminCount",
    query: { enabled: isConnected, retry: 3, retryDelay: 1000 },
  });

  const {
    data: contractState,
    error: contractStateError,
    isLoading: contractStateLoading,
  } = useReadContracts({
    contracts: [
      {
        address: ADMIN_CONTRACT_ADDRESS,
        abi: adminABI,
        functionName: "factoryContract",
      },
      {
        address: ADMIN_CONTRACT_ADDRESS,
        abi: adminABI,
        functionName: "airdropContract",
      },
      {
        address: ADMIN_CONTRACT_ADDRESS,
        abi: adminABI,
        functionName: "priceFeed",
      },
      {
        address: AIRDROP_CONTRACT_ADDRESS,
        abi: airdropFactoryABI,
        functionName: "getAirdropCount",
      },
    ],
    query: { enabled: isConnected, retry: 3, retryDelay: 1000 },
  });

  const {
    data: blockNumber,
    error: blockNumberError,
    isLoading: blockNumberLoading,
  } = useBlockNumber({
    query: { enabled: isConnected, retry: 3, retryDelay: 1000 },
  });

  const adminChecks = React.useMemo(() => {
    if (!adminCount || !isConnected || !adminCountSuccess) return [];
    const count = Number(adminCount);
    return Array.from({ length: count }, (_, i) => ({
      address: ADMIN_CONTRACT_ADDRESS as `0x${string}`,
      abi: adminABI,
      functionName: "admin" as const,
      args: [i] as const,
    }));
  }, [adminCount, isConnected, adminCountSuccess]);

  const {
    data: adminAddresses,
    error: adminAddressesError,
    isLoading: adminAddressesLoading,
    isSuccess: adminAddressesSuccess,
  } = useReadContracts({
    contracts: adminChecks,
    query: { enabled: adminChecks.length > 0, retry: 3, retryDelay: 1000 },
  });

  const {
    data: activeAirdropsData,
    error: activeAirdropsError,
    isLoading: activeAirdropsLoading,
  } = useReadContract({
    address: AIRDROP_CONTRACT_ADDRESS,
    abi: airdropFactoryABI,
    functionName: "getActiveAirdrops",
    args: [BigInt(10)], // Limit to 10 active airdrops for performance
    query: {
      enabled: isConnected && !!contractState?.[1]?.result,
      retry: 3,
      retryDelay: 1000,
    },
  });

  useEffect(() => {
    if (
      !address ||
      !adminAddressesSuccess ||
      !adminAddresses ||
      adminAddresses.length === 0
    ) {
      if (!adminCountLoading && !adminAddressesLoading && adminCountSuccess) {
        setLoading(false);
      }
      return;
    }

    let isAdminUser = false;
    for (let i = 0; i < adminAddresses.length; i++) {
      const result = adminAddresses[i];
      if (result?.status === "success" && result.result) {
        const adminAddress = result.result as string;
        if (
          adminAddress &&
          adminAddress.toLowerCase() === address?.toLowerCase()
        ) {
          isAdminUser = true;
          break;
        }
      }
    }

    setIsAdmin(isAdminUser);
    setLoading(false);
  }, [
    address,
    adminAddresses,
    adminAddressesSuccess,
    adminCountLoading,
    adminAddressesLoading,
    adminCountSuccess,
  ]);

  useEffect(() => {
    if (activeAirdropsData) {
      setActiveAirdrops(activeAirdropsData as AirdropInfo[]);
    }
  }, [activeAirdropsData]);

  // Mock event fetching (replace with actual event logs via ethers.js or a subgraph)
  useEffect(() => {
    // Placeholder for fetching AirdropFeePaid events from StrataForgeAdmin
    // Example using ethers.js (you'll need to integrate with your provider)
    /*
    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    const adminContract = new ethers.Contract(ADMIN_CONTRACT_ADDRESS, adminABI, provider);
    adminContract.queryFilter(adminContract.filters.AirdropFeePaid(), 0, "latest").then(events => {
      setFeePaidEvents(events.map(event => ({
        payer: event.args.payer,
        recipients: Number(event.args.recipients),
        amountETH: event.args.amountETH,
        amountUSD: event.args.amountUSD,
        timestamp: Number(event.args.timestamp) * 1000,
      })));
    });
    */
    // Mock data for now
    setFeePaidEvents([
      {
        payer: "0x123...abc",
        recipients: 100,
        amountETH: BigInt(1e18),
        amountUSD: BigInt(2500e8),
        timestamp: Date.now() - 86400000,
      },
      {
        payer: "0x456...def",
        recipients: 50,
        amountETH: BigInt(5e17),
        amountUSD: BigInt(1250e8),
        timestamp: Date.now() - 2 * 86400000,
      },
    ]);

    // Placeholder for fetching AirdropCreated events from StrataForgeAirdropFactory
    /*
    const airdropContract = new ethers.Contract(AIRDROP_CONTRACT_ADDRESS, airdropFactoryABI, provider);
    airdropContract.queryFilter(airdropContract.filters.AirdropCreated(), 0, "latest").then(events => {
      setAirdropCreatedEvents(events.map(event => ({
        creator: event.args.creator,
        distributor: event.args.distributor,
        token: event.args.token,
        tokenType: Number(event.args.tokenType),
        totalRecipients: Number(event.args.totalRecipients),
        airdropIndex: Number(event.args.airdropIndex),
        timestamp: Date.now(), // Fetch block timestamp
      })));
    });
    */
    // Mock data for now
    setAirdropCreatedEvents([
      {
        creator: "0x123...abc",
        distributor: "0x789...ghi",
        token: "0xabc...123",
        tokenType: 0,
        totalRecipients: 100,
        airdropIndex: 1,
        timestamp: Date.now() - 86400000,
      },
      {
        creator: "0x456...def",
        distributor: "0xdef...456",
        token: "0xghi...789",
        tokenType: 1,
        totalRecipients: 50,
        airdropIndex: 2,
        timestamp: Date.now() - 2 * 86400000,
      },
    ]);
  }, [blockNumber]);

  useEffect(() => {
    const errors: string[] = [];
    if (adminCountError) errors.push("Failed to load admin count");
    if (adminAddressesError) errors.push("Failed to load admin addresses");
    if (contractStateError) errors.push("Failed to load contract state");
    if (activeAirdropsError) errors.push("Failed to load active airdrops");
    if (blockNumberError) errors.push("Failed to load block number");

    setError(errors.join(", "));
    if (
      !adminCountLoading &&
      !adminAddressesLoading &&
      !contractStateLoading &&
      !activeAirdropsLoading &&
      !blockNumberLoading
    ) {
      setLoading(false);
    }
  }, [
    adminCountError,
    adminAddressesError,
    contractStateError,
    activeAirdropsError,
    blockNumberError,
    adminCountLoading,
    adminAddressesLoading,
    contractStateLoading,
    activeAirdropsLoading,
    blockNumberLoading,
  ]);

  const handleGenerateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      airdropCount: contractState?.[3]?.result?.toString() || "0",
      activeAirdrops: activeAirdrops.length,
      totalRecipients: activeAirdrops.reduce(
        (sum, airdrop) => sum + airdrop.totalRecipients,
        0
      ),
      totalFeesETH: feePaidEvents
        .reduce((sum, event) => sum + event.amountETH, BigInt(0))
        .toString(),
      totalFeesUSD: feePaidEvents
        .reduce((sum, event) => sum + event.amountUSD, BigInt(0))
        .toString(),
      transactionHistory: feePaidEvents.map((event) => ({
        payer: event.payer,
        recipients: event.recipients,
        amountETH: event.amountETH.toString(),
        amountUSD: event.amountUSD.toString(),
        timestamp: new Date(event.timestamp).toISOString(),
      })),
      airdropHistory: airdropCreatedEvents.map((event) => ({
        creator: event.creator,
        distributor: event.distributor,
        token: event.token,
        tokenType: ["ERC20", "ERC721", "ERC1155"][event.tokenType] || "Unknown",
        totalRecipients: event.totalRecipients,
        airdropIndex: event.airdropIndex,
        timestamp: new Date(event.timestamp).toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `StrataForge_Report_${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setReportGenerated(true);
    setTimeout(() => setReportGenerated(false), 3000);
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-[#1A0D23] relative">
      <div className="text-center relative z-10">
        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading analytics...</p>
        {error && <p className="text-red-400 text-sm mt-2 max-w-md">{error}</p>}
      </div>
    </div>
  );

  const WalletConnection = () => (
    <div className="min-h-screen bg-[#1A0D23] flex items-center justify-center p-4 relative">
      <div className="bg-[#1E1425]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-500/20 p-8 text-center relative z-10">
        <h2 className="text-2xl font-bold text-white mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-gray-300 mb-6">
          Connect your wallet to view analytics and reports
        </p>
        <button
          onClick={() => document.querySelector("appkit-button")?.click()}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl hover:opacity-90 transition"
        >
          Connect Wallet
        </button>
      </div>
    </div>
  );

  const UnauthorizedAccess = () => (
    <div className="min-h-screen bg-[#1A0D23] relative overflow-hidden flex items-center justify-center p-4">
      <div className="max-w-lg w-full relative z-10">
        <div className="bg-[#1E1425]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-red-500/20 p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-300 mb-6">
              You are not authorized to view analytics and reports
            </p>
          </div>
          <div className="bg-[#16091D]/60 backdrop-blur-sm rounded-xl p-4 mb-6 text-left space-y-2 border border-gray-700/30">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Connected Address:</span>
              <span className="font-mono text-gray-300 text-xs">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Admin Count:</span>
              <span className="font-mono text-gray-300">
                {adminCount ? Number(adminCount).toString() : "0"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Network:</span>
              <span className="font-mono text-gray-300">Base Sepolia</span>
            </div>
            {error && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-red-400 text-xs">Error</span>
                </div>
                <div className="text-xs text-red-400 mt-2 p-2 bg-red-500/10 rounded">
                  {error}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );

  if (!isConnected) return <WalletConnection />;
  if (loading) return <LoadingSpinner />;
  if (!isAdmin) return <UnauthorizedAccess />;

  const airdropFactoryAddress = contractState?.[1]?.result as
    | string
    | undefined;
  const priceFeedAddress = contractState?.[2]?.result as string | undefined;
  const airdropCount = contractState?.[3]?.result as bigint | undefined;

  return (
    <AdminDashboardLayout>
      <div className="min-h-screen bg-[#1A0D23] p-4 md:p-8 relative">
        <div
          className="welcome-section text-center mb-8 rounded-lg p-6 relative z-10"
          style={{
            background:
              "radial-gradient(50% 206.8% at 50% 50%, rgba(10, 88, 116, 0.7) 0%, rgba(32, 23, 38, 0.7) 56.91%)",
          }}
        >
          <h1 className="font-poppins font-semibold text-3xl md:text-4xl leading-[170%] mb-2">
            Analytics & Reports <span className="text-purple-400">📊</span>
          </h1>
          <p className="font-vietnam font-normal text-base leading-[170%] tracking-[1%] text-[hsl(var(--foreground)/0.7)]">
            View detailed analytics, transaction history, fee collections, and
            generate comprehensive platform reports.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center space-x-3 relative z-10">
            <svg
              className="w-5 h-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-300 font-medium">{error}</p>
          </div>
        )}

        <div className="mb-10 relative z-10">
          <h2 className="font-poppins font-semibold text-xl md:text-2xl mb-6">
            Platform Analytics
          </h2>
          <div className="bg-[#1E1425]/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-purple-500/10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#16091D]/60 rounded-xl">
              <h3 className="text-lg font-semibold text-white">
                Total Airdrops Created
              </h3>
              <p className="text-2xl font-bold text-purple-400">
                {airdropCount?.toString() || "0"}
              </p>
            </div>
            <div className="p-4 bg-[#16091D]/60 rounded-xl">
              <h3 className="text-lg font-semibold text-white">
                Active Airdrops
              </h3>
              <p className="text-2xl font-bold text-purple-400">
                {activeAirdrops.length}
              </p>
            </div>
            <div className="p-4 bg-[#16091D]/60 rounded-xl">
              <h3 className="text-lg font-semibold text-white">
                Total Recipients
              </h3>
              <p className="text-2xl font-bold text-purple-400">
                {activeAirdrops.reduce(
                  (sum, airdrop) => sum + airdrop.totalRecipients,
                  0
                )}
              </p>
            </div>
            <div className="p-4 bg-[#16091D]/60 rounded-xl">
              <h3 className="text-lg font-semibold text-white">
                Total Fees (ETH)
              </h3>
              <p className="text-2xl font-bold text-purple-400">
                {(
                  Number(
                    feePaidEvents.reduce(
                      (sum, event) => sum + event.amountETH,
                      BigInt(0)
                    )
                  ) / 1e18
                ).toFixed(4)}{" "}
                ETH
              </p>
            </div>
            <div className="p-4 bg-[#16091D]/60 rounded-xl">
              <h3 className="text-lg font-semibold text-white">
                Total Fees (USD)
              </h3>
              <p className="text-2xl font-bold text-purple-400">
                $
                {(
                  Number(
                    feePaidEvents.reduce(
                      (sum, event) => sum + event.amountUSD,
                      BigInt(0)
                    )
                  ) / 1e8
                ).toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-[#16091D]/60 rounded-xl">
              <h3 className="text-lg font-semibold text-white">
                Airdrop Factory Contract
              </h3>
              <a
                href={`${EXPLORER_URL}/${airdropFactoryAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 font-mono text-sm hover:underline break-all"
              >
                {airdropFactoryAddress
                  ? `${airdropFactoryAddress.slice(
                      0,
                      6
                    )}...${airdropFactoryAddress.slice(-4)}`
                  : "Not set"}
              </a>
            </div>
            <div className="p-4 bg-[#16091D]/60 rounded-xl">
              <h3 className="text-lg font-semibold text-white">Price Feed</h3>
              <a
                href={`${EXPLORER_URL}/${priceFeedAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 font-mono text-sm hover:underline break-all"
              >
                {priceFeedAddress
                  ? `${priceFeedAddress.slice(0, 6)}...${priceFeedAddress.slice(
                      -4
                    )}`
                  : "Not set"}
              </a>
            </div>
          </div>
        </div>

        <div className="mb-10 relative z-10">
          <h2 className="font-poppins font-semibold text-xl md:text-2xl mb-6">
            Transaction History
          </h2>
          <div className="bg-[#1E1425]/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-purple-500/10">
            <h3 className="text-lg font-semibold text-white mb-4">
              Airdrop Fee Payments
            </h3>
            {feePaidEvents.length === 0 ? (
              <p className="text-gray-300">No fee payments found.</p>
            ) : (
              <div className="space-y-4">
                {feePaidEvents.map((event, index) => (
                  <div
                    key={index}
                    className="p-4 bg-[#16091D]/60 rounded-xl border border-gray-700/30"
                  >
                    <p className="text-gray-300">
                      <span className="font-medium">Payer:</span>{" "}
                      <a
                        href={`${EXPLORER_URL}/${event.payer}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {event.payer.slice(0, 6)}...{event.payer.slice(-4)}
                      </a>
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">Recipients:</span>{" "}
                      {event.recipients}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">Amount (ETH):</span>{" "}
                      {(Number(event.amountETH) / 1e18).toFixed(4)} ETH
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">Amount (USD):</span> $
                      {(Number(event.amountUSD) / 1e8).toFixed(2)}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">Timestamp:</span>{" "}
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-10 relative z-10">
          <h2 className="font-poppins font-semibold text-xl md:text-2xl mb-6">
            Airdrop History
          </h2>
          <div className="bg-[#1E1425]/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-purple-500/10">
            <h3 className="text-lg font-semibold text-white mb-4">
              Airdrop Creations
            </h3>
            {airdropCreatedEvents.length === 0 ? (
              <p className="text-gray-300">No airdrops created.</p>
            ) : (
              <div className="space-y-4">
                {airdropCreatedEvents.map((event, index) => (
                  <div
                    key={index}
                    className="p-4 bg-[#16091D]/60 rounded-xl border border-gray-700/30"
                  >
                    <p className="text-gray-300">
                      <span className="font-medium">Creator:</span>{" "}
                      <a
                        href={`${EXPLORER_URL}/${event.creator}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {event.creator.slice(0, 6)}...{event.creator.slice(-4)}
                      </a>
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">Distributor:</span>{" "}
                      <a
                        href={`${EXPLORER_URL}/${event.distributor}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {event.distributor.slice(0, 6)}...
                        {event.distributor.slice(-4)}
                      </a>
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">Token:</span>{" "}
                      <a
                        href={`${EXPLORER_URL}/${event.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {event.token.slice(0, 6)}...{event.token.slice(-4)}
                      </a>
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">Token Type:</span>{" "}
                      {["ERC20", "ERC721", "ERC1155"][event.tokenType] ||
                        "Unknown"}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">Total Recipients:</span>{" "}
                      {event.totalRecipients}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">Airdrop Index:</span>{" "}
                      {event.airdropIndex}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium">Timestamp:</span>{" "}
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-10 relative z-10">
          <h2 className="font-poppins font-semibold text-xl md:text-2xl mb-6">
            Generate Report
          </h2>
          <div className="bg-[#1E1425]/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-purple-500/10">
            <button
              onClick={handleGenerateReport}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Generate Platform Report
            </button>
            {reportGenerated && (
              <p className="text-green-400 text-sm mt-2">
                Report generated successfully!
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AnalyticsReports;

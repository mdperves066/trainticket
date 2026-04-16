import dynamic from 'next/dynamic';

const LoadingComponent = dynamic(() => import('@/components/LoadingComponent'), { ssr: false });

export default function Loading() {
    return <LoadingComponent />;
}
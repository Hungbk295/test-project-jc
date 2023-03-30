import { Layout } from 'antd';
import Sidebar from 'app/layouts/Sidebar';
import moment from 'moment';

const { Content, Footer } = Layout;

interface DefaultLayoutProps {
  children: JSX.Element;
}

export default function DefaultLayout(props: DefaultLayoutProps) {
  const { children } = props;
  const currentYear = moment().format('YYYY');
  return (
    <Layout className="min-h-screen">
      <Sidebar />
      <Layout>
        <Content className="#cbd5e1 px-2 pb-2 flex flex-col">{children}</Content>
        <Footer className="bg-white text-center py-[13px]">
          Copyright {currentYear} TIDESQUARE CORPORATION. All rights reserved.
        </Footer>
      </Layout>
    </Layout>
  );
}

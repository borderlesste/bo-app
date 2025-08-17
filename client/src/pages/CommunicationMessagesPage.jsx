import PropTypes from 'prop-types';
import AdminMessagesPage from './AdminMessagesPage';

const CommunicationMessagesPage = ({ showNavigation = true }) => {
  // This component wraps AdminMessagesPage for the admin dashboard
  return <AdminMessagesPage />;
};

CommunicationMessagesPage.propTypes = {
  showNavigation: PropTypes.bool
};

export default CommunicationMessagesPage;
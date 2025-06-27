import Head from 'next/head';
import { Navbar, Container, Nav, Button, Image } from 'react-bootstrap';
import Dropdown from 'react-bootstrap/Dropdown';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Link from 'next/link';

const Layout = ({ children, user }) => {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div className="d-flex flex-column vh-100">
      <Head>
        <title>Book Rental</title>
        <meta name="description" content="Online Book Rental Application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar expand="lg" className="navbar-main" variant="light" sticky="top">
        <Container>
          <Link href="/" passHref>
            <Navbar.Brand className="navbar-brand">
              <span className="text-primary">Book</span>Rental
            </Navbar.Brand>
          </Link>
          
          <Navbar.Toggle aria-controls="main-navbar-nav" className="border-0" />
          
          <Navbar.Collapse id="main-navbar-nav" className="justify-content-end">
            <Nav as="ul" className="align-items-lg-center">
              {user ? (
                <>
                  <Nav.Item as="li">
                    <Link href="/my-posted-books" passHref legacyBehavior>
                      <Nav.Link className="nav-link">My Posted Books</Nav.Link>
                    </Link>
                  </Nav.Item>
                  
                  <Nav.Item as="li">
                    <Link href="/my-rented-books" passHref legacyBehavior>
                      <Nav.Link className="nav-link">My Rented Books</Nav.Link>
                    </Link>
                  </Nav.Item>
                  
                  {user.role === 'admin' && (
                    <Nav.Item as="li">
                      <Link href="/admin" passHref legacyBehavior>
                        <Nav.Link className="nav-link">Admin Dashboard</Nav.Link>
                      </Link>
                    </Nav.Item>
                  )}
                  
                  <Nav.Item as="li" className="ms-lg-3">
                    <Dropdown align="end">
                      <Dropdown.Toggle as="div" className="user-dropdown-toggle">
                        <div className="avatar-container">
                          {user.avatar_url ? (
                            <Image
                              src={user.avatar_url}
                              width={38}
                              height={38}
                              className="avatar-img"
                              alt={user.username}
                            />
                          ) : (
                            <div className="avatar-initials">
                              {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                        </div>
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="dropdown-menu-end">
                        <Dropdown.Item href="/profile" className="dropdown-item">
                          <i className="bi bi-person-fill me-2"></i>My Profile
                        </Dropdown.Item>
                        <Dropdown.Item href="/change-password" className="dropdown-item">
                          <i className="bi bi-key-fill me-2"></i>Change Password
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={handleLogout} className="dropdown-item text-danger">
                          <i className="bi bi-box-arrow-right me-2"></i>Logout
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </Nav.Item>
                </>
              ) : (
                <>
                  <Nav.Item as="li" className="me-lg-3">
                    <Link href="/login" passHref legacyBehavior>
                      <Nav.Link className="nav-link">Login</Nav.Link>
                    </Link>
                  </Nav.Item>
                  <Nav.Item as="li">
                    <Link href="/signup" passHref legacyBehavior>
                      <Nav.Link className="btn btn-primary btn-sm px-3 rounded-pill">
                        Sign Up
                      </Nav.Link>
                    </Link>
                  </Nav.Item>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="flex-shrink-0">
        <Container className="my-5">
          {children}
        </Container>
      </main>

      <footer className="py-4 bg-white text-center text-muted border-top shadow-sm" style={{
        backgroundColor: 'white',
        color: '#6c757d',
        borderTop: '1px solid rgba(0,0,0,.1)'
      }}>
        <Container>
          <p className="mb-0">&copy; {new Date().getFullYear()} Book Rental. All rights reserved.</p>
        </Container>
      </footer>
    </div>
  );
};

export default Layout;

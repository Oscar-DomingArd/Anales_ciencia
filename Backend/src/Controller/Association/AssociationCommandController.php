<?php

/**
 * src/Controller/Association/AssociationCommandController.php
 *
 * @license https://opensource.org/licenses/MIT MIT License
 * @link    https://www.etsisi.upm.es/ ETS de Ingeniería de Sistemas Informáticos
 */

namespace TDW\ACiencia\Controller\Association;

use DateTime;
use Doctrine\Common\Collections\Criteria;
use Doctrine\ORM\Exception\ORMException;
use Slim\Http\Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Fig\Http\Message\StatusCodeInterface as StatusCode;
use TDW\ACiencia\Utility\Error;
use TDW\ACiencia\Controller\Element\ElementBaseCommandController;
use TDW\ACiencia\Entity\Association;
use TDW\ACiencia\Factory\AssociationFactory;
use TDW\ACiencia\Factory\ElementFactory;

class AssociationCommandController extends ElementBaseCommandController
{
    /** @var string ruta api gestión asociaciones */
    public const string PATH_ASSOCIATIONS = '/associations';

    /**
     * @return class-string<Association>
     */
    public static function getEntityClassName(): string
    {
        return Association::class;
    }

    /**
     * @return string
     */
    public static function getEntityIdName(): string
    {
        return 'associationId';
    }

    /**
     * @return string
     */
    protected static function getFactoryClassName(): string
    {
        return AssociationFactory::class;
    }

    /**
     * Sobrescribe creación para usar AssociationFactory especializado
     * @throws \DateMalformedStringException
     * @throws ORMException
     */
    public function post(Request $request, Response $response): Response
    {

        assert($request->getMethod() === 'POST');

        if (!$this->checkWriterScope($request)) { //403
            return Error::createResponse($response, StatusCode::STATUS_FORBIDDEN);
        }

        $data = (array) $request->getParsedBody();

        if (!isset($data['name']) || !isset($data['website'])) { //422 -Faltan datos
            return Error::createResponse($response, StatusCode::STATUS_UNPROCESSABLE_ENTITY);
        }

        // Unicidad de nombre
        $criteria = Criteria::create()->where(Criteria::expr()->eq('name', $data['name']));
        if ($this->entityManager->getRepository(Association::class)->matching($criteria)->count() !== 0) {
            return Error::createResponse($response, StatusCode::STATUS_BAD_REQUEST);
        }

        // Crear instancia con fábrica especializada
        $association = AssociationFactory::createAssociation(
            $data['name'],
            $data['website'],
            isset($data['birthDate'])    ? new DateTime($data['birthDate'])    : null,
            isset($data['deathDate']) ? new DateTime($data['deathDate']) : null,
            $data['imageUrl'] ?? null,
            $data['wikiUrl']  ?? null
        );

        // Persistir y responder
        $this->entityManager->persist($association);
        $this->entityManager->flush();

        return $response
        ->withAddedHeader('Location', $request->getUri() . '/' . $association->getId())
            ->withJson($association, StatusCode::STATUS_CREATED);
    }

    /**
     * Sobrescribe actualización para manejar website en Association
     */
    public function put(Request $request, Response $response, array $args): Response
    {
        assert($request->getMethod() === 'PUT');
        if (!$this->checkWriterScope($request)) {
            return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);
        }

        $data   = (array) $request->getParsedBody();
        $idName = static::getEntityIdName();
        if (($args[$idName] ?? 0) <= 0 || $args[$idName] > 2147483647) {
            return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);
        }

        $this->entityManager->beginTransaction();
        /** @var Association|null $association */
        $association = $this->entityManager->getRepository(Association::class)->find($args[$idName]);
        if (!$association instanceof Association) {
            $this->entityManager->rollback();
            return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);
        }

        // Optimistic Locking
        $etag = md5((string) json_encode($association));
        if (!in_array($etag, $request->getHeader('If-Match'), true)) {
            $this->entityManager->rollback();
            return Error::createResponse($response, StatusCode::STATUS_PRECONDITION_REQUIRED);
        }

        // Nombre
        if (isset($data['name'])) {
            $existingId = $this->findIdByName(Association::class, $data['name']);
            if ($existingId !== 0 && intval($args[$idName]) !== $existingId) {
                $this->entityManager->rollback();
                return Error::createResponse($response, StatusCode::STATUS_BAD_REQUEST);
            }
            $association->setName($data['name']);
        }

        // Website
        if (isset($data['website'])) {
            $association->setWebsite($data['website']);
        }

        // Resto de atributos (fechas, imagen, wiki)
        $this->updateElement($association, $data);

        $this->entityManager->flush();
        $this->entityManager->commit();

        return $response
            ->withStatus(209, 'Content Returned')
            ->withJson($association);
    }


}
